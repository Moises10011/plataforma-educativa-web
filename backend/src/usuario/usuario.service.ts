import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Usuario } from './entities/usuario.entity';
import { Rol } from '../rol/entities/rol.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { CrearConRolDto } from './dto/crear-con-rol.dto';
import { AsignacionCurso } from '../asignacion-curso/entities/asignacion-curso.entity';
import { Matricula } from '../matricula/entities/matricula.entity';
import { Nota } from '../nota/entities/nota.entity';
import { EntregaTarea } from '../entrega-tarea/entities/entrega-tarea.entity';
import { Asistencia } from '../asistencia/entities/asistencia.entity';
import { Curso } from '../curso/entities/curso.entity';
import { Tarea } from '../tarea/entities/tarea.entity';
import { Libreta } from '../libreta/entities/libreta.entity';

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
    @InjectRepository(Nota)
    private readonly notaRepository: Repository<Nota>,
    @InjectRepository(EntregaTarea)
    private readonly entregaRepository: Repository<EntregaTarea>,
    @InjectRepository(Asistencia)
    private readonly asistenciaRepository: Repository<Asistencia>,
    @InjectRepository(Curso)
    private readonly cursoRepository: Repository<Curso>,
    @InjectRepository(Tarea)
    private readonly tareaRepository: Repository<Tarea>,
    @InjectRepository(Libreta)
    private readonly libretaRepository: Repository<Libreta>,
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

    if (updateUsuarioDto.correo && updateUsuarioDto.correo !== usuario.correo) {
      const enUso = await this.usuarioRepository.findOne({
        where: { correo: updateUsuarioDto.correo },
      });
      if (enUso && enUso.id_usuario !== usuario.id_usuario) {
        throw new ConflictException(
          `El correo ${updateUsuarioDto.correo} ya está en uso`,
        );
      }
      usuario.correo = updateUsuarioDto.correo;
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
    const rol = await this.rolRepository.findOne({
      where: { nombre_rol: dto.rol },
    });
    if (!rol) throw new BadRequestException(`Rol '${dto.rol}' no encontrado`);

    const usuarioPorCorreo = await this.usuarioRepository.findOne({
      where: { correo: dto.correo },
    });

    let usuario = await this.usuarioRepository.findOne({
      where: { dni: dto.dni },
      relations: { roles: true },
    });

    let passwordGenerado: string | null = null;

    if (usuario) {
      // Estudiante ya existente (ej. re-matrícula en un nuevo año académico)
      if (
        usuarioPorCorreo &&
        usuarioPorCorreo.id_usuario !== usuario.id_usuario
      ) {
        throw new ConflictException(
          `El correo ${dto.correo} ya está en uso por otro usuario`,
        );
      }
    } else {
      if (usuarioPorCorreo) {
        throw new ConflictException(`El correo ${dto.correo} ya está en uso`);
      }

      passwordGenerado = `${dto.nombres.split(' ')[0]}${dto.dni}`;
      const password = await bcrypt.hash(passwordGenerado, 10);

      usuario = this.usuarioRepository.create({
        nombres: dto.nombres,
        apellidos: dto.apellidos,
        dni: dto.dni,
        telefono: dto.telefono,
        direccion: dto.direccion,
        fecha_nacimiento: dto.fecha_nacimiento
          ? new Date(dto.fecha_nacimiento)
          : undefined,
        correo: dto.correo,
        password,
        roles: [rol],
      });
      usuario = await this.usuarioRepository.save(usuario);
    }

    if (
      dto.rol === 'Estudiante' &&
      dto.id_grado &&
      dto.id_seccion &&
      dto.id_periodo
    ) {
      // Un estudiante NO puede tener dos matrículas en el mismo año académico
      // (periodo), sin importar grado o sección. Entre periodos distintos sí
      // puede volver a matricularse (ej. pasó de 2do a 3ro).
      const matriculaEnEsePeriodo = await this.matriculaRepository.findOne({
        where: {
          id_usuario: usuario.id_usuario,
          id_periodo: dto.id_periodo,
        },
      });
      if (matriculaEnEsePeriodo) {
        throw new ConflictException(
          `El estudiante ya tiene una matrícula registrada en este periodo académico`,
        );
      }

      const matricula = this.matriculaRepository.create({
        id_usuario: usuario.id_usuario,
        id_grado: dto.id_grado,
        id_seccion: dto.id_seccion,
        id_periodo: dto.id_periodo,
      });
      await this.matriculaRepository.save(matricula);
    }

    return {
      ...usuario,
      correo_generado: usuario.correo,
      password_generado: passwordGenerado,
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

  private async obtenerCursosConDocente(matricula: Matricula) {
    const todosLosCursos = await this.cursoRepository.find();

    const asignaciones = await this.asignacionRepository.find({
      where: {
        id_grado: matricula.id_grado,
        id_seccion: matricula.id_seccion,
        id_periodo: matricula.id_periodo,
      },
      relations: { docente: true },
    });

    return todosLosCursos.map((curso) => {
      const asignacion = asignaciones.find(
        (a) => a.id_curso === curso.id_curso,
      );
      return {
        id_asignacion: asignacion?.id_asignacion ?? 0,
        curso: {
          id_curso: curso.id_curso,
          nombre: curso.nombre,
          descripcion: curso.descripcion,
        },
        docente: asignacion?.docente
          ? {
              id_usuario: asignacion.docente.id_usuario,
              nombres: asignacion.docente.nombres,
              apellidos: asignacion.docente.apellidos,
            }
          : null,
      };
    });
  }

  async findCursosEstudiante(authUser: AuthUser) {
    const matricula = await this.matriculaRepository.findOne({
      where: { id_usuario: authUser.id_usuario, estado: true },
      order: { fecha_matricula: 'DESC' },
    });

    if (!matricula) {
      const todosLosCursos = await this.cursoRepository.find();
      return {
        cursos: todosLosCursos.map((curso) => ({
          id_asignacion: 0,
          curso: {
            id_curso: curso.id_curso,
            nombre: curso.nombre,
            descripcion: curso.descripcion,
          },
          docente: null,
        })),
      };
    }

    const cursos = await this.obtenerCursosConDocente(matricula);
    return { cursos };
  }

  async getResumenDashboardEstudiante(authUser: AuthUser) {
    const matricula = await this.matriculaRepository.findOne({
      where: { id_usuario: authUser.id_usuario, estado: true },
      order: { fecha_matricula: 'DESC' },
    });

    let tareasPendientes = 0;

    if (matricula) {
      const asignaciones = await this.asignacionRepository.find({
        where: {
          id_grado: matricula.id_grado,
          id_seccion: matricula.id_seccion,
          id_periodo: matricula.id_periodo,
        },
      });
      const idsAsignaciones = asignaciones.map((a) => a.id_asignacion);

      if (idsAsignaciones.length > 0) {
        const tareas = await this.tareaRepository.find({
          where: { id_asignacion: In(idsAsignaciones) },
        });
        const idsTareas = tareas.map((t) => t.id_tarea);

        if (idsTareas.length > 0) {
          const entregas = await this.entregaRepository.find({
            where: {
              id_tarea: In(idsTareas),
              id_usuario_estudiante: authUser.id_usuario,
            },
          });
          const idsTareasEntregadas = new Set(entregas.map((e) => e.id_tarea));
          tareasPendientes = idsTareas.filter(
            (id) => !idsTareasEntregadas.has(id),
          ).length;
        }
      }
    }

    const boletasDisponibles = await this.libretaRepository.count({
      where: { id_estudiante: authUser.id_usuario },
    });

    return { tareasPendientes, boletasDisponibles };
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

    let cursosConNotas: any[] = [];
    let idsAsignaciones: number[] = [];
    let promedioGeneral = 0;
    let totalAsistencias = 0;
    let totalInasistencias = 0;
    let tareasPendientes = 0;

    if (matricula) {
      const asignaciones = await this.asignacionRepository.find({
        where: {
          id_grado: matricula.id_grado,
          id_seccion: matricula.id_seccion,
          id_periodo: matricula.id_periodo,
        },
        relations: { curso: true, docente: true },
      });
      idsAsignaciones = asignaciones.map((a) => a.id_asignacion);

      const cursosConInfo = await this.obtenerCursosConDocente(matricula);

      cursosConNotas = await Promise.all(
        cursosConInfo.map(async (cursoInfo) => {
          const idAsignacion = cursoInfo.id_asignacion;

          const notasCurso =
            idAsignacion > 0
              ? await this.notaRepository
                  .createQueryBuilder('nota')
                  .innerJoin('nota.entrega', 'entrega')
                  .innerJoin('entrega.tarea', 'tarea')
                  .where('tarea.id_asignacion = :idAsignacion', {
                    idAsignacion,
                  })
                  .andWhere('nota.id_usuario_estudiante = :idEstudiante', {
                    idEstudiante: authUser.id_usuario,
                  })
                  .getMany()
              : [];

          const promedioCurso =
            notasCurso.length > 0
              ? Math.round(
                  (notasCurso.reduce((acc, n) => acc + Number(n.valor), 0) /
                    notasCurso.length) *
                    100,
                ) / 100
              : 0;

          const asistenciasCurso =
            idAsignacion > 0
              ? await this.asistenciaRepository.count({
                  where: {
                    id_asignacion: idAsignacion,
                    id_usuario_estudiante: authUser.id_usuario,
                    estado: 'presente',
                  },
                })
              : 0;

          return {
            id_asignacion: idAsignacion,
            nombre: cursoInfo.curso.nombre,
            nota: promedioCurso,
            asistencia: asistenciasCurso,
          };
        }),
      );

      if (idsAsignaciones.length > 0) {
        const notas = await this.notaRepository
          .createQueryBuilder('nota')
          .innerJoin('nota.entrega', 'entrega')
          .innerJoin('entrega.tarea', 'tarea')
          .where('tarea.id_asignacion IN (:...ids)', {
            ids: idsAsignaciones,
          })
          .andWhere('nota.id_usuario_estudiante = :idEstudiante', {
            idEstudiante: authUser.id_usuario,
          })
          .getMany();

        if (notas.length > 0) {
          const suma = notas.reduce((acc, n) => acc + Number(n.valor), 0);
          promedioGeneral = Math.round((suma / notas.length) * 100) / 100;
        }

        const registrosAsistencia = await this.asistenciaRepository
          .createQueryBuilder('asistencia')
          .where('asistencia.id_asignacion IN (:...ids)', {
            ids: idsAsignaciones,
          })
          .andWhere('asistencia.id_usuario_estudiante = :idEstudiante', {
            idEstudiante: authUser.id_usuario,
          })
          .getMany();

        totalAsistencias = registrosAsistencia.filter(
          (r) => r.estado === 'presente',
        ).length;
        totalInasistencias = registrosAsistencia.filter(
          (r) => r.estado === 'ausente',
        ).length;

        const tareas = await this.tareaRepository.find({
          where: { id_asignacion: In(idsAsignaciones) },
        });
        const idsTareas = tareas.map((t) => t.id_tarea);

        if (idsTareas.length > 0) {
          const entregas = await this.entregaRepository.find({
            where: {
              id_tarea: In(idsTareas),
              id_usuario_estudiante: authUser.id_usuario,
            },
          });
          const idsTareasEntregadas = new Set(entregas.map((e) => e.id_tarea));
          tareasPendientes = idsTareas.filter(
            (id) => !idsTareasEntregadas.has(id),
          ).length;
        }
      }
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
      cursos: cursosConNotas,
      estadisticas: {
        promedioGeneral,
        asistencias: totalAsistencias,
        inasistencias: totalInasistencias,
        tareasPendientes,
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

  async getAsignacionDetalle(id_asignacion: number, authUser: AuthUser) {
    const asignacion = await this.asignacionRepository.findOne({
      where: { id_asignacion },
      relations: { curso: true, grado: true, seccion: true, periodo: true },
    });
    if (!asignacion) {
      throw new NotFoundException(`Asignación #${id_asignacion} no encontrada`);
    }

    const esAdmin = authUser.roles?.includes('Administrador');
    if (!esAdmin && asignacion.id_usuario_docente !== authUser.id_usuario) {
      throw new ForbiddenException('Esta asignación no te pertenece');
    }

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
  }

  async getAsignacionDetalleEstudiante(
    id_asignacion: number,
    authUser: AuthUser,
  ) {
    const matricula = await this.matriculaRepository.findOne({
      where: { id_usuario: authUser.id_usuario, estado: true },
      order: { fecha_matricula: 'DESC' },
    });

    if (!matricula) {
      throw new NotFoundException('No tienes una matrícula activa');
    }

    const asignacion = await this.asignacionRepository.findOne({
      where: { id_asignacion },
      relations: {
        curso: true,
        grado: true,
        seccion: true,
        periodo: true,
        docente: true,
      },
    });

    if (!asignacion) {
      throw new NotFoundException(`Asignación #${id_asignacion} no encontrada`);
    }

    const pertenece =
      asignacion.id_grado === matricula.id_grado &&
      asignacion.id_seccion === matricula.id_seccion &&
      asignacion.id_periodo === matricula.id_periodo;

    if (!pertenece) {
      throw new ForbiddenException(
        'Este curso no corresponde a tu grado y sección',
      );
    }

    return {
      id_asignacion: asignacion.id_asignacion,
      curso: asignacion.curso,
      grado: asignacion.grado,
      seccion: asignacion.seccion,
      periodo: asignacion.periodo,
      docente: asignacion.docente
        ? {
            id_usuario: asignacion.docente.id_usuario,
            nombres: asignacion.docente.nombres,
            apellidos: asignacion.docente.apellidos,
          }
        : null,
    };
  }

  async getCursoDetalleEstudiante(id_curso: number, authUser: AuthUser) {
    const curso = await this.cursoRepository.findOne({
      where: { id_curso },
    });
    if (!curso) {
      throw new NotFoundException(`Curso #${id_curso} no encontrado`);
    }

    const matricula = await this.matriculaRepository.findOne({
      where: { id_usuario: authUser.id_usuario, estado: true },
      relations: { grado: true, seccion: true, periodo: true },
      order: { fecha_matricula: 'DESC' },
    });

    if (!matricula) {
      throw new NotFoundException('No tienes una matrícula activa');
    }

    const asignacion = await this.asignacionRepository.findOne({
      where: {
        id_curso: curso.id_curso,
        id_grado: matricula.id_grado,
        id_seccion: matricula.id_seccion,
        id_periodo: matricula.id_periodo,
      },
      relations: { grado: true, seccion: true, periodo: true, docente: true },
    });

    return {
      id_asignacion: asignacion?.id_asignacion ?? 0,
      curso: {
        id_curso: curso.id_curso,
        nombre: curso.nombre,
        descripcion: curso.descripcion,
      },
      grado: asignacion?.grado ?? matricula.grado ?? null,
      seccion: asignacion?.seccion ?? matricula.seccion ?? null,
      periodo: asignacion?.periodo ?? matricula.periodo ?? null,
      docente: asignacion?.docente
        ? {
            id_usuario: asignacion.docente.id_usuario,
            nombres: asignacion.docente.nombres,
            apellidos: asignacion.docente.apellidos,
          }
        : null,
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
