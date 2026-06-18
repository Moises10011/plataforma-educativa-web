import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Tarea } from './entities/tarea.entity';
import { CreateTareaDto } from './dto/create-tarea.dto';
import { UpdateTareaDto } from './dto/update-tarea.dto';

@Injectable()
export class TareaService {
  constructor(
    @InjectRepository(Tarea)
    private readonly tareaRepository: Repository<Tarea>,
  ) {}

  async create(createTareaDto: CreateTareaDto) {
    const tarea = this.tareaRepository.create(createTareaDto);
    return await this.tareaRepository.save(tarea);
  }

  findAll() {
    return this.tareaRepository.find({
      relations: { asignacion: true },
    });
  }

  async findOne(id: number) {
    const tarea = await this.tareaRepository.findOne({
      where: { id_tarea: id },
      relations: { asignacion: true },
    });
    if (!tarea) throw new NotFoundException(`Tarea #${id} no encontrada`);
    return tarea;
  }

  async update(id: number, updateTareaDto: UpdateTareaDto) {
    const tarea = await this.findOne(id);
    Object.assign(tarea, updateTareaDto);
    return await this.tareaRepository.save(tarea);
  }

  async remove(id: number) {
    const tarea = await this.findOne(id);
    await this.tareaRepository.remove(tarea);
    return { message: `Tarea #${id} eliminada correctamente` };
  }
}
