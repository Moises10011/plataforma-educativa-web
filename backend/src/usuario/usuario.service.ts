import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
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
    @InjectRepository(AsignacionCurso)
    private readonly asignacionRepository: Repository<AsignacionCurso>,
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
  ) {}

  // ─── CRUD BASE ─────────────────────────────────────────────────────────────

  async create(createUsuarioDto: CreateUsuarioDto) {
    const passwordEncriptado = await bcrypt.hash(createUsuarioDto.password, 10);
    const usuario = this.usuarioRepository.create({
      ...createUsuarioDto,
      password: passwordEncriptado,
    });
    return await this.usuarioRepository.save(usuario);
  }

  async findAll(authUser: AuthUser) {
    const esAdmin = authUser.roles?.includes('Administrador');

    if (esAdmin) {
      return this.usuarioRepository.find({ relations: { roles: true } });
    }

    // Docente: solo ve estudiantes de sus secciones asignadas
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

    Object.assign(usuario, updateUsuarioDto);
    return await this.usuarioRepository.save(usuario);
  }

  async remove(id: number) {
    const usuario = await this.findOne(id);
    await this.usuarioRepository.remove(usuario);
    return { message: `Usuario #${id} eliminado correctamente` };
  }

  // ─── DASHBOARDS ────────────────────────────────────────────────────────────

  /**
   * Dashboard del Estudiante
   * Devuelve: perfil, matrícula activa (grado, sección, periodo),
   * cursos asignados a su sección y conteo de tareas pendientes.
   */
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

    // Matrícula activa del estudiante
    const matricula = await this.matriculaRepository.findOne({
      where: { id_usuario: authUser.id_usuario, estado: true },
      relations: { grado: true, seccion: true, periodo: true },
      order: { fecha_matricula: 'DESC' },
    });

    // Cursos de su sección (si tiene matrícula activa)
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

  /**
   * Dashboard del Docente
   * Devuelve: perfil, cursos asignados con sus secciones/grados/periodos,
   * y conteo de estudiantes por sección.
   */
  async getDocenteDashboard(authUser: AuthUser) {
    const perfil = await this.usuarioRepository.findOne({
      where: { id_usuario: authUser.id_usuario },
      relations: { roles: true },
    });

    if (!perfil) throw new NotFoundException('Usuario no encontrado');

    // Todas las asignaciones del docente
    const asignaciones = await this.asignacionRepository.find({
      where: { id_usuario_docente: authUser.id_usuario },
      relations: { curso: true, grado: true, seccion: true, periodo: true },
    });

    // Para cada asignación, contar estudiantes matriculados en esa sección
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

    // Secciones únicas a cargo del docente
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

  /**
   * Dashboard del Administrador
   * Devuelve: conteo global de usuarios, docentes, estudiantes y matrículas activas.
   */
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
