import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Grado } from './entities/grado.entity';
import { CreateGradoDto } from './dto/create-grado.dto';
import { UpdateGradoDto } from './dto/update-grado.dto';

@Injectable()
export class GradoService {
  constructor(
    @InjectRepository(Grado)
    private readonly gradoRepository: Repository<Grado>,
  ) {}

  async create(createGradoDto: CreateGradoDto) {
    const grado = this.gradoRepository.create(createGradoDto);
    return await this.gradoRepository.save(grado);
  }

  findAll() {
    return this.gradoRepository.find();
  }

  async findOne(id: number) {
    const grado = await this.gradoRepository.findOneBy({ id_grado: id });
    if (!grado) throw new NotFoundException(`Grado #${id} no encontrado`);
    return grado;
  }

  async update(id: number, updateGradoDto: UpdateGradoDto) {
    const grado = await this.findOne(id);
    Object.assign(grado, updateGradoDto);
    return await this.gradoRepository.save(grado);
  }

  async remove(id: number) {
    const grado = await this.findOne(id);
    await this.gradoRepository.remove(grado);
    return { message: `Grado #${id} eliminado correctamente` };
  }
}
