import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Seccion } from './entities/seccion.entity';
import { CreateSeccionDto } from './dto/create-seccion.dto';
import { UpdateSeccionDto } from './dto/update-seccion.dto';

@Injectable()
export class SeccionService {
  constructor(
    @InjectRepository(Seccion)
    private readonly seccionRepository: Repository<Seccion>,
  ) {}

  async create(createSeccionDto: CreateSeccionDto) {
    const seccion = this.seccionRepository.create(createSeccionDto);
    return await this.seccionRepository.save(seccion);
  }

  findAll() {
    return this.seccionRepository.find();
  }

  async findOne(id: number) {
    const seccion = await this.seccionRepository.findOneBy({ id_seccion: id });
    if (!seccion) throw new NotFoundException(`Seccion #${id} no encontrada`);
    return seccion;
  }

  async update(id: number, updateSeccionDto: UpdateSeccionDto) {
    const seccion = await this.findOne(id);
    Object.assign(seccion, updateSeccionDto);
    return await this.seccionRepository.save(seccion);
  }

  async remove(id: number) {
    const seccion = await this.findOne(id);
    await this.seccionRepository.remove(seccion);
    return { message: `Seccion #${id} eliminada correctamente` };
  }
}
