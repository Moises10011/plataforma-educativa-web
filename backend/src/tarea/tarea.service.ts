import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Tarea } from './entities/tarea.entity';
import { CreateTareaDto } from './dto/create-tarea.dto';
import { UpdateTareaDto } from './dto/update-tarea.dto';
import { AsignacionCurso } from '../asignacion-curso/entities/asignacion-curso.entity';
import { Matricula } from '../matricula/entities/matricula.entity';
import { EntregaTarea } from '../entrega-tarea/entities/entrega-tarea.entity';
import { Nota } from '../nota/entities/nota.entity';

interface AuthUser {
  id_usuario: number;
  roles?: string[];
}

@Injectable()
export class TareaService {
  constructor(
    @InjectRepository(Tarea)
    private readonly tareaRepository: Repository<Tarea>,
    @InjectRepository(AsignacionCurso)
    private readonly asignacionRepository: Repository<AsignacionCurso>,
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
    @InjectRepository(EntregaTarea)
    private readonly entregaRepository: Repository<EntregaTarea>,
    @InjectRepository(Nota)
    private readonly notaRepository: Repository<Nota>,
  ) {}

  async create(
    createTareaDto: CreateTareaDto,
    authUser: AuthUser,
    archivos?: Express.Multer.File[],
  ) {
    const asignacion = await this.asignacionRepository.findOneBy({
      id_asignacion: createTareaDto.id_asignacion,
    });
    if (!asignacion || asignacion.id_usuario_docente !== authUser.id_usuario) {
      throw new ForbiddenException(
        'No puedes crear una tarea en una asignacion que no es tuya',
      );
    }

    const tarea = this.tareaRepository.create({
      ...createTareaDto,
      archivos: archivos?.length ? archivos.map((a) => a.filename) : null,
    });
    return await this.tareaRepository.save(tarea);
  }

  async findAll(authUser: AuthUser) {
    const esAdmin = authUser.roles?.includes('Administrador');
    const esDocente = authUser.roles?.includes('Docente');
    const esEstudiante = authUser.roles?.includes('Estudiante');

    const todas = await this.tareaRepository.find({
      relations: { asignacion: true },
    });

    if (esAdmin) return todas;

    if (esDocente) {
      return todas.filter(
        (t) => t.asignacion.id_usuario_docente === authUser.id_usuario,
      );
    }

    if (esEstudiante) {
      const matriculas = await this.matriculaRepository.find({
        where: { id_usuario: authUser.id_usuario },
      });

      return todas.filter((t) =>
        matriculas.some(
          (mat) =>
            mat.id_grado === t.asignacion.id_grado &&
            mat.id_seccion === t.asignacion.id_seccion &&
            mat.id_periodo === t.asignacion.id_periodo,
        ),
      );
    }

    return [];
  }
  async findPendientesEstudiante(authUser: AuthUser) {
    const todas = await this.findAll(authUser);

    const entregas = await this.entregaRepository.find({
      where: { id_usuario_estudiante: authUser.id_usuario },
    });
    const idsEntregadas = new Set(entregas.map((e) => e.id_tarea));

    return todas.filter((t) => !idsEntregadas.has(t.id_tarea));
  }

  async findOne(id: number) {
    const tarea = await this.tareaRepository.findOne({
      where: { id_tarea: id },
      relations: { asignacion: true },
    });
    if (!tarea) throw new NotFoundException(`Tarea #${id} no encontrada`);
    return tarea;
  }

  private async verificarPropietario(id: number, authUser: AuthUser) {
    const tarea = await this.findOne(id);
    if (tarea.asignacion.id_usuario_docente !== authUser.id_usuario) {
      throw new ForbiddenException(
        'No puedes modificar tareas de otro docente',
      );
    }
    return tarea;
  }

  async update(id: number, updateTareaDto: UpdateTareaDto, authUser: AuthUser) {
    const tarea = await this.verificarPropietario(id, authUser);
    Object.assign(tarea, updateTareaDto);
    return await this.tareaRepository.save(tarea);
  }

  async remove(id: number, authUser: AuthUser) {
    const tarea = await this.verificarPropietario(id, authUser);

    // 1. Busca las entregas de esta tarea
    const entregas = await this.entregaRepository.find({
      where: { id_tarea: id },
    });
    const idsEntregas = entregas.map((e) => e.id_entrega);

    // 2. Borra las notas asociadas a esas entregas (si hay alguna)
    if (idsEntregas.length) {
      await this.notaRepository.delete({ id_entrega: In(idsEntregas) });
    }

    // 3. Borra las entregas
    await this.entregaRepository.delete({ id_tarea: id });

    // 4. Borra la tarea
    await this.tareaRepository.remove(tarea);
    return { message: `Tarea #${id} eliminada correctamente` };
  }
}
