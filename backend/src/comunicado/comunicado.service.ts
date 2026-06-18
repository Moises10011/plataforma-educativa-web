import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Comunicado } from './entities/comunicado.entity';
import { CreateComunicadoDto } from './dto/create-comunicado.dto';
import { UpdateComunicadoDto } from './dto/update-comunicado.dto';

@Injectable()
export class ComunicadoService {
  constructor(
    @InjectRepository(Comunicado)
    private readonly comunicadoRepository: Repository<Comunicado>,
  ) {}

  async create(createComunicadoDto: CreateComunicadoDto) {
    const comunicado = this.comunicadoRepository.create(createComunicadoDto);
    return await this.comunicadoRepository.save(comunicado);
  }

  findAll() {
    return this.comunicadoRepository.find({
      relations: { admin: true },
    });
  }

  async findOne(id: number) {
    const comunicado = await this.comunicadoRepository.findOne({
      where: { id_comunicado: id },
      relations: { admin: true },
    });
    if (!comunicado)
      throw new NotFoundException(`Comunicado #${id} no encontrado`);
    return comunicado;
  }

  async update(id: number, updateComunicadoDto: UpdateComunicadoDto) {
    const comunicado = await this.findOne(id);
    Object.assign(comunicado, updateComunicadoDto);
    return await this.comunicadoRepository.save(comunicado);
  }

  async remove(id: number) {
    const comunicado = await this.findOne(id);
    await this.comunicadoRepository.remove(comunicado);
    return { message: `Comunicado #${id} eliminado correctamente` };
  }
}
