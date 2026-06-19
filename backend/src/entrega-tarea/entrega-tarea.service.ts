import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EntregaTarea } from './entities/entrega-tarea.entity';
import { CreateEntregaTareaDto } from './dto/create-entrega-tarea.dto';
import { UpdateEntregaTareaDto } from './dto/update-entrega-tarea.dto';

interface AuthUser {
  id_usuario: number;
  roles?: string[];
}

@Injectable()
export class EntregaTareaService {
  constructor(
    @InjectRepository(EntregaTarea)
    private readonly entregaRepository: Repository<EntregaTarea>,
  ) {}

  async create(
    createEntregaTareaDto: CreateEntregaTareaDto,
    authUser: AuthUser,
  ) {
    if (createEntregaTareaDto.id_usuario_estudiante !== authUser.id_usuario) {
      throw new ForbiddenException(
        'No puedes entregar una tarea en nombre de otro estudiante',
      );
    }

    const entrega = this.entregaRepository.create(createEntregaTareaDto);
    return await this.entregaRepository.save(entrega);
  }

  async findAll(authUser: AuthUser) {
    const esEstudiante = authUser.roles?.includes('Estudiante');

    if (esEstudiante) {
      return this.entregaRepository.find({
        where: { id_usuario_estudiante: authUser.id_usuario },
        relations: { tarea: true, estudiante: true },
      });
    }

    return this.entregaRepository.find({
      relations: { tarea: true, estudiante: true },
    });
  }

  async findOne(id: number) {
    const entrega = await this.entregaRepository.findOne({
      where: { id_entrega: id },
      relations: { tarea: true, estudiante: true },
    });
    if (!entrega) throw new NotFoundException(`Entrega #${id} no encontrada`);
    return entrega;
  }

  async update(
    id: number,
    updateEntregaTareaDto: UpdateEntregaTareaDto,
    authUser: AuthUser,
  ) {
    const entrega = await this.findOne(id);

    if (entrega.id_usuario_estudiante !== authUser.id_usuario) {
      throw new ForbiddenException(
        'No puedes modificar la entrega de otro estudiante',
      );
    }

    Object.assign(entrega, updateEntregaTareaDto);
    return await this.entregaRepository.save(entrega);
  }

  async remove(id: number) {
    const entrega = await this.findOne(id);
    await this.entregaRepository.remove(entrega);
    return { message: `Entrega #${id} eliminada correctamente` };
  }
}
