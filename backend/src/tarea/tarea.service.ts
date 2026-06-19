import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Tarea } from './entities/tarea.entity';
import { CreateTareaDto } from './dto/create-tarea.dto';
import { UpdateTareaDto } from './dto/update-tarea.dto';
import { AsignacionCurso } from '../asignacion-curso/entities/asignacion-curso.entity';
import { Matricula } from '../matricula/entities/matricula.entity';

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
  ) {}

  async create(createTareaDto: CreateTareaDto, authUser: AuthUser) {
    const asignacion = await this.asignacionRepository.findOneBy({
      id_asignacion: createTareaDto.id_asignacion,
    });
    if (!asignacion || asignacion.id_usuario_docente !== authUser.id_usuario) {
      throw new ForbiddenException(
        'No puedes crear una tarea en una asignacion que no es tuya',
      );
    }

    const tarea = this.tareaRepository.create(createTareaDto);
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
    await this.tareaRepository.remove(tarea);
    return { message: `Tarea #${id} eliminada correctamente` };
  }
}
