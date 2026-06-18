import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EntregaTarea } from './entities/entrega-tarea.entity';
import { CreateEntregaTareaDto } from './dto/create-entrega-tarea.dto';
import { UpdateEntregaTareaDto } from './dto/update-entrega-tarea.dto';

@Injectable()
export class EntregaTareaService {
  constructor(
    @InjectRepository(EntregaTarea)
    private readonly entregaRepository: Repository<EntregaTarea>,
  ) {}

  async create(createEntregaTareaDto: CreateEntregaTareaDto) {
    const entrega = this.entregaRepository.create(createEntregaTareaDto);
    return await this.entregaRepository.save(entrega);
  }

  findAll() {
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

  async update(id: number, updateEntregaTareaDto: UpdateEntregaTareaDto) {
    const entrega = await this.findOne(id);
    Object.assign(entrega, updateEntregaTareaDto);
    return await this.entregaRepository.save(entrega);
  }

  async remove(id: number) {
    const entrega = await this.findOne(id);
    await this.entregaRepository.remove(entrega);
    return { message: `Entrega #${id} eliminada correctamente` };
  }
}
