import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Usuario } from './entities/usuario.entity';
import { Rol } from '../rol/entities/rol.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { CrearConRolDto } from './dto/crear-con-rol.dto';
import { AsignacionCurso } from '../asignacion-curso/entities/asignacion-curso.entity';
import { Matricula } from '../matricula/entities/matricula.entity';

interface AuthUser {
  id_usuario: number;
  correo?: string;
  roles?: string[];
}

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    @InjectRepository(AsignacionCurso)
    private readonly asignacionRepository: Repository<AsignacionCurso>,
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto) {
    const passwordEncriptado = await bcrypt.hash(createUsuarioDto.password, 10);
    const usuario = this.usuarioRepository.create({
      nombres: createUsuarioDto.nombres,
      apellidos: createUsuarioDto.apellidos,
      dni: createUsuarioDto.dni,
      telefono: createUsuarioDto.telefono,
      direccion: createUsuarioDto.direccion,
      fecha_nacimiento: createUsuarioDto.fecha_nacimiento
        ? new Date(createUsuarioDto.fecha_nacimiento)
        : undefined,
      correo: createUsuarioDto.correo,
      password: passwordEncriptado,
    });
    return await this.usuarioRepository.save(usuario);
  }

  async findAll(authUser: AuthUser) {
    const esAdmin = authUser.roles?.includes('Administrador');

    if (esAdmin) {
      return this.usuarioRepository.find({ relations: { roles: true } });
    }

    const asignaciones = await this.asignacionRepository.find({
      where: { id_usuario_docente: authUser.id_usuario },
    });

    if (asignaciones.length === 0) return [];

    const combinaciones = asignaciones.map((a) => ({
      id_grado: a.id_grado,
      id_seccion: a.id_seccion,
      id_periodo: a.id_periodo,
    }));

    const matriculas = await this.matriculaRepository.find({
      relations: { usuario: true },
    });

    const idsEstudiantes = new Set<number>();
    for (const matricula of matriculas) {
      const coincide = combinaciones.some(
        (c) =>
          c.id_grado === matricula.id_grado &&
          c.id_seccion === matricula.id_seccion &&
          c.id_periodo === matricula.id_periodo,
      );
      if (coincide) idsEstudiantes.add(matricula.id_usuario);
    }

    if (idsEstudiantes.size === 0) return [];

    return this.usuarioRepository.find({
      where: Array.from(idsEstudiantes).map((id) => ({ id_usuario: id })),
      relations: { roles: true },
    });
  }

  async findOne(id: number) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id_usuario: id },
      relations: { roles: true },
    });
    if (!usuario) throw new NotFoundException(`Usuario #${id} no encontrado`);
    return usuario;
  }

  async findMyProfile(authUser: AuthUser) {
    return this.findOne(authUser.id_usuario);
  }

  async findByRol(nombreRol: string) {
    const usuarios = await this.usuarioRepository.find({
      relations: { roles: true },
    });
    return usuarios.filter((u) =>
      u.roles.some((r) => r.nombre_rol === nombreRol),
    );
  }

  async contarPorRol() {
    const usuarios = await this.usuarioRepository.find({
      relations: { roles: true },
    });

    const totalEstudiantes = usuarios.filter((u) =>
      u.roles.some((r) => r.nombre_rol === 'Estudiante'),
    ).length;

    const totalDocentes = usuarios.filter((u) =>
      u.roles.some((r) => r.nombre_rol === 'Docente'),
    ).length;

    const totalAdministradores = usuarios.filter((u) =>
      u.roles.some((r) => r.nombre_rol === 'Administrador'),
    ).length;

    return { totalEstudiantes, totalDocentes, totalAdministradores };
  }

  async update(
    id: number,
    updateUsuarioDto: UpdateUsuarioDto,
    authUser: AuthUser,
  ) {
    const esAdmin = authUser.roles?.includes('Administrador');
    const esPropio = authUser.id_usuario === id;

    if (!esAdmin && !esPropio) {
      throw new ForbiddenException(
        'No puedes modificar el perfil de otro usuario',
      );
    }

    const usuario = await this.findOne(id);

    if (updateUsuarioDto.password) {
      updateUsuarioDto.password = await bcrypt.hash(
        updateUsuarioDto.password,
        10,
      );
    }

    if (updateUsuarioDto.nombres) usuario.nombres = updateUsuarioDto.nombres;
    if (updateUsuarioDto.apellidos)
      usuario.apellidos = updateUsuarioDto.apellidos;
    if (updateUsuarioDto.dni) usuario.dni = updateUsuarioDto.dni;
    if (updateUsuarioDto.telefono !== undefined)
      usuario.telefono = updateUsuarioDto.telefono;
    if (updateUsuarioDto.direccion !== undefined)
      usuario.direccion = updateUsuarioDto.direccion;
    if (updateUsuarioDto.fecha_nacimiento) {
      usuario.fecha_nacimiento = new Date(updateUsuarioDto.fecha_nacimiento);
    }
    if (updateUsuarioDto.estado !== undefined)
      usuario.estado = updateUsuarioDto.estado;

    return await this.usuarioRepository.save(usuario);
  }
  async actualizarEstudiante(
    id_matricula: number,
    datosUsuario: UpdateUsuarioDto,
    datosMatricula: {
      id_grado: number;
      id_seccion: number;
      id_periodo: number;
      estado: boolean;
    },
    authUser: AuthUser,
  ) {
    const matricula = await this.matriculaRepository.findOne({
      where: { id_matricula },
      relations: { usuario: true },
    });
    if (!matricula)
      throw new NotFoundException(`Matrícula #${id_matricula} no encontrada`);

    await this.update(matricula.id_usuario, datosUsuario, authUser);

    Object.assign(matricula, datosMatricula);
    await this.matriculaRepository.save(matricula);

    return { message: 'Estudiante actualizado correctamente' };
  }
  async remove(id: number) {
    const usuario = await this.findOne(id);
    await this.usuarioRepository.remove(usuario);
    return { message: `Usuario #${id} eliminado correctamente` };
  }

  async crearConRol(dto: CrearConRolDto) {
    const existe = await this.usuarioRepository.findOne({
      where: { dni: dto.dni },
    });
    if (existe) {
      throw new ConflictException(`Ya existe un usuario con DNI ${dto.dni}`);
    }

    const correo = `${dto.dni}@micaela.edu.pe`;
    const passwordPlano = `${dto.nombres.split(' ')[0]}${dto.dni}`;
    const password = await bcrypt.hash(passwordPlano, 10);

    const rol = await this.rolRepository.findOne({
      where: { nombre_rol: dto.rol },
    });
    if (!rol) throw new BadRequestException(`Rol '${dto.rol}' no encontrado`);

    const usuario = this.usuarioRepository.create({
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      dni: dto.dni,
      telefono: dto.telefono,
      direccion: dto.direccion,
      fecha_nacimiento: dto.fecha_nacimiento
        ? new Date(dto.fecha_nacimiento)
        : undefined,
      correo,
      password,
      roles: [rol],
    });
    const usuarioGuardado = await this.usuarioRepository.save(usuario);

    if (
      dto.rol === 'Estudiante' &&
      dto.id_grado &&
      dto.id_seccion &&
      dto.id_periodo
    ) {
      const matricula = this.matriculaRepository.create({
        id_usuario: usuarioGuardado.id_usuario,
        id_grado: dto.id_grado,
        id_seccion: dto.id_seccion,
        id_periodo: dto.id_periodo,
      });
      await this.matriculaRepository.save(matricula);
    }

    return {
      ...usuarioGuardado,
      correo_generado: correo,
      password_generado: passwordPlano,
    };
  }

  async crearMasivo(usuarios: CrearConRolDto[]) {
    const resultados = {
      exitosos: [] as any[],
      errores: [] as any[],
    };

    for (const dto of usuarios) {
      try {
        const usuario = await this.crearConRol(dto);
        resultados.exitosos.push({
          dni: dto.dni,
          nombre: `${dto.nombres} ${dto.apellidos}`,
          correo: usuario.correo_generado,
        });
      } catch (error: unknown) {
        const mensaje =
          error instanceof Error ? error.message : 'Error desconocido';
        resultados.errores.push({
          dni: dto.dni,
          nombre: `${dto.nombres} ${dto.apellidos}`,
          error: mensaje,
        });
      }
    }

    return resultados;
  }

  async getEstudianteDashboard(authUser: AuthUser) {
    const perfil = await this.usuarioRepository.findOne({
      where: { id_usuario: authUser.id_usuario },
      relations: { roles: true },
      select: {
        id_usuario: true,
        nombres: true,
        apellidos: true,
        correo: true,
        estado: true,
        fecha_registro: true,
      },
    });

    if (!perfil) throw new NotFoundException('Usuario no encontrado');

    const matricula = await this.matriculaRepository.findOne({
      where: { id_usuario: authUser.id_usuario, estado: true },
      relations: { grado: true, seccion: true, periodo: true },
      order: { fecha_matricula: 'DESC' },
    });

    let cursos: AsignacionCurso[] = [];
    if (matricula) {
      cursos = await this.asignacionRepository.find({
        where: {
          id_grado: matricula.id_grado,
          id_seccion: matricula.id_seccion,
          id_periodo: matricula.id_periodo,
        },
        relations: { curso: true, docente: true },
      });
    }

    return {
      perfil: {
        id_usuario: perfil.id_usuario,
        nombres: perfil.nombres,
        apellidos: perfil.apellidos,
        correo: perfil.correo,
        estado: perfil.estado,
        fecha_registro: perfil.fecha_registro,
      },
      matricula: matricula
        ? {
            id_matricula: matricula.id_matricula,
            grado: matricula.grado,
            seccion: matricula.seccion,
            periodo: matricula.periodo,
            fecha_matricula: matricula.fecha_matricula,
          }
        : null,
      cursos: cursos.map((a) => ({
        id_asignacion: a.id_asignacion,
        curso: a.curso,
        docente: {
          id_usuario: a.docente.id_usuario,
          nombres: a.docente.nombres,
          apellidos: a.docente.apellidos,
        },
      })),
      resumen: {
        total_cursos: cursos.length,
        tiene_matricula_activa: !!matricula,
      },
    };
  }

  async getDocenteDashboard(authUser: AuthUser) {
    const perfil = await this.usuarioRepository.findOne({
      where: { id_usuario: authUser.id_usuario },
      relations: { roles: true },
    });

    if (!perfil) throw new NotFoundException('Usuario no encontrado');

    const asignaciones = await this.asignacionRepository.find({
      where: { id_usuario_docente: authUser.id_usuario },
      relations: { curso: true, grado: true, seccion: true, periodo: true },
    });

    const asignacionesConEstudiantes = await Promise.all(
      asignaciones.map(async (asignacion) => {
        const totalEstudiantes = await this.matriculaRepository.count({
          where: {
            id_grado: asignacion.id_grado,
            id_seccion: asignacion.id_seccion,
            id_periodo: asignacion.id_periodo,
            estado: true,
          },
        });

        return {
          id_asignacion: asignacion.id_asignacion,
          curso: asignacion.curso,
          grado: asignacion.grado,
          seccion: asignacion.seccion,
          periodo: asignacion.periodo,
          total_estudiantes: totalEstudiantes,
        };
      }),
    );

    const seccionesUnicas = new Map<string, object>();
    for (const a of asignaciones) {
      const key = `${a.id_grado}-${a.id_seccion}-${a.id_periodo}`;
      if (!seccionesUnicas.has(key)) {
        seccionesUnicas.set(key, {
          grado: a.grado,
          seccion: a.seccion,
          periodo: a.periodo,
        });
      }
    }

    return {
      perfil: {
        id_usuario: perfil.id_usuario,
        nombres: perfil.nombres,
        apellidos: perfil.apellidos,
        correo: perfil.correo,
        estado: perfil.estado,
      },
      asignaciones: asignacionesConEstudiantes,
      resumen: {
        total_cursos_asignados: asignaciones.length,
        total_secciones: seccionesUnicas.size,
      },
    };
  }

  async getAdminDashboard(authUser: AuthUser) {
    const perfil = await this.findOne(authUser.id_usuario);

    const [totalUsuarios, totalMatriculas, conteoRoles] = await Promise.all([
      this.usuarioRepository.count(),
      this.matriculaRepository.count({ where: { estado: true } }),
      this.contarPorRol(),
    ]);

    const ultimosUsuarios = await this.usuarioRepository.find({
      relations: { roles: true },
      order: { fecha_registro: 'DESC' },
      take: 5,
      select: {
        id_usuario: true,
        nombres: true,
        apellidos: true,
        correo: true,
        fecha_registro: true,
      },
    });

    return {
      perfil: {
        id_usuario: perfil.id_usuario,
        nombres: perfil.nombres,
        apellidos: perfil.apellidos,
        correo: perfil.correo,
      },
      resumen: {
        total_usuarios: totalUsuarios,
        total_matriculas_activas: totalMatriculas,
        ...conteoRoles,
      },
      ultimos_usuarios_registrados: ultimosUsuarios,
    };
  }
}
