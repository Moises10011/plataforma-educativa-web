import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AsignacionCurso } from './entities/asignacion-curso.entity';
import { CreateAsignacionCursoDto } from './dto/create-asignacion-curso.dto';
import { UpdateAsignacionCursoDto } from './dto/update-asignacion-curso.dto';
import { Matricula } from '../matricula/entities/matricula.entity';
import { Tarea } from '../tarea/entities/tarea.entity';
import { EntregaTarea } from '../entrega-tarea/entities/entrega-tarea.entity';
import { Asistencia } from '../asistencia/entities/asistencia.entity';
import { Material } from '../material/entities/material.entity';

@Injectable()
export class AsignacionCursoService {
  constructor(
    @InjectRepository(AsignacionCurso)
    private readonly asignacionRepository: Repository<AsignacionCurso>,
  ) {}

  async create(createAsignacionCursoDto: CreateAsignacionCursoDto) {
    const asignacion = this.asignacionRepository.create(
      createAsignacionCursoDto,
    );
    return await this.asignacionRepository.save(asignacion);
  }

  findAll() {
    return this.asignacionRepository.find({
      relations: {
        docente: true,
        curso: true,
        grado: true,
        seccion: true,
        periodo: true,
      },
    });
  }

  async findOne(id: number) {
    const asignacion = await this.asignacionRepository.findOne({
      where: { id_asignacion: id },
      relations: {
        docente: true,
        curso: true,
        grado: true,
        seccion: true,
        periodo: true,
      },
    });
    if (!asignacion)
      throw new NotFoundException(`Asignacion #${id} no encontrada`);
    return asignacion;
  }

  async update(id: number, updateAsignacionCursoDto: UpdateAsignacionCursoDto) {
    const asignacion = await this.findOne(id);
    Object.assign(asignacion, updateAsignacionCursoDto);
    return await this.asignacionRepository.save(asignacion);
  }

  async remove(id: number) {
    const asignacion = await this.findOne(id);
    await this.asignacionRepository.remove(asignacion);
    return { message: `Asignacion #${id} eliminada correctamente` };
  }

  async findEstudiantes(id_asignacion: number) {
    const asignacion = await this.findOne(id_asignacion);

    const matriculas = await this.asignacionRepository.manager
      .getRepository(Matricula)
      .find({
        where: {
          id_grado: asignacion.id_grado,
          id_seccion: asignacion.id_seccion,
          id_periodo: asignacion.id_periodo,
          estado: true,
        },
        relations: { usuario: true },
      });

    return matriculas.map((m) => ({
      id_usuario: m.usuario.id_usuario,
      nombres: m.usuario.nombres,
      apellidos: m.usuario.apellidos,
      correo: m.usuario.correo,
      estado: m.usuario.estado,
    }));
  }

  async findTareas(id_asignacion: number) {
    await this.findOne(id_asignacion);

    const tareas = await this.asignacionRepository.manager
      .getRepository(Tarea)
      .find({
        where: { id_asignacion },
        order: { fecha_entrega: 'DESC' },
      });

    const resultado = await Promise.all(
      tareas.map(async (tarea) => {
        const total_entregas = await this.asignacionRepository.manager
          .getRepository(EntregaTarea)
          .count({ where: { id_tarea: tarea.id_tarea } });

        return { ...tarea, total_entregas };
      }),
    );

    return resultado;
  }

  async findEntregasPorTarea(id_tarea: number) {
    const entregas = await this.asignacionRepository.manager
      .getRepository(EntregaTarea)
      .find({
        where: { id_tarea },
        relations: { estudiante: true },
        order: { fecha_entrega: 'DESC' },
      });

    return entregas.map((e) => ({
      id_entrega: e.id_entrega,
      comentario: e.comentario,
      archivo: e.archivo,
      fecha_entrega: e.fecha_entrega,
      estado: e.estado,
      estudiante: {
        id_usuario: e.estudiante.id_usuario,
        nombres: e.estudiante.nombres,
        apellidos: e.estudiante.apellidos,
      },
    }));
  }

  async findAsistencia(id_asignacion: number) {
    await this.findOne(id_asignacion);

    const registros = await this.asignacionRepository.manager
      .getRepository(Asistencia)
      .find({
        where: { id_asignacion },
        relations: { estudiante: true },
        order: { fecha: 'DESC' },
      });

    return registros.map((r) => ({
      id_asistencia: r.id_asistencia,
      fecha: r.fecha,
      estado: r.estado,
      estudiante: {
        id_usuario: r.estudiante.id_usuario,
        nombres: r.estudiante.nombres,
        apellidos: r.estudiante.apellidos,
      },
    }));
  }

  async findResumenAsistencia(id_asignacion: number) {
    await this.findOne(id_asignacion);

    const registros = await this.asignacionRepository.manager
      .getRepository(Asistencia)
      .find({
        where: { id_asignacion },
        relations: { estudiante: true },
      });

    const mapa = new Map<
      number,
      {
        id_usuario: number;
        nombres: string;
        apellidos: string;
        presentes: number;
        ausentes: number;
        tardanzas: number;
      }
    >();

    for (const r of registros) {
      const id = r.estudiante.id_usuario;
      if (!mapa.has(id)) {
        mapa.set(id, {
          id_usuario: id,
          nombres: r.estudiante.nombres,
          apellidos: r.estudiante.apellidos,
          presentes: 0,
          ausentes: 0,
          tardanzas: 0,
        });
      }
      const entry = mapa.get(id)!;
      if (r.estado === 'presente') entry.presentes++;
      else if (r.estado === 'ausente') entry.ausentes++;
      else if (r.estado === 'tardanza') entry.tardanzas++;
    }

    return Array.from(mapa.values());
  }

  async registrarAsistenciaLote(
    id_asignacion: number,
    fecha: string,
    registros: { id_usuario: number; estado: string }[],
  ) {
    await this.findOne(id_asignacion);

    const asistencias = registros.map((r) =>
      this.asignacionRepository.manager.getRepository(Asistencia).create({
        id_asignacion,
        id_usuario_estudiante: r.id_usuario,
        fecha: new Date(fecha),
        estado: r.estado,
      }),
    );

    await this.asignacionRepository.manager
      .getRepository(Asistencia)
      .save(asistencias);

    return {
      message: `Asistencia registrada para ${asistencias.length} estudiantes.`,
    };
  }

  async findMateriales(id_asignacion: number) {
    await this.findOne(id_asignacion);

    const materiales = await this.asignacionRepository.manager
      .getRepository(Material)
      .find({
        where: { id_asignacion },
        order: { fecha_publicacion: 'DESC' },
      });

    return materiales.map((m) => ({
      id_material: m.id_material,
      titulo: m.titulo,
      descripcion: m.descripcion,
      url_archivo: m.archivo
        ? `/api/material/${m.id_material}/descargar`
        : null,
      fecha_publicacion: m.fecha_publicacion,
    }));
  }
}
