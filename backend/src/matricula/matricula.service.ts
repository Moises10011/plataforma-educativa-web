import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Matricula } from './entities/matricula.entity';
import { CreateMatriculaDto } from './dto/create-matricula.dto';
import { UpdateMatriculaDto } from './dto/update-matricula.dto';

@Injectable()
export class MatriculaService {
  constructor(
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
  ) {}

  async create(createMatriculaDto: CreateMatriculaDto) {
    const matricula = this.matriculaRepository.create(createMatriculaDto);
    return await this.matriculaRepository.save(matricula);
  }

  findAll() {
    return this.matriculaRepository.find({
      relations: {
        usuario: true,
        grado: true,
        seccion: true,
        periodo: true,
      },
    });
  }

  async findOne(id: number) {
    const matricula = await this.matriculaRepository.findOne({
      where: { id_matricula: id },
      relations: {
        usuario: true,
        grado: true,
        seccion: true,
        periodo: true,
      },
    });
    if (!matricula)
      throw new NotFoundException(`Matricula #${id} no encontrada`);
    return matricula;
  }

  async update(id: number, updateMatriculaDto: UpdateMatriculaDto) {
    const matricula = await this.findOne(id);
    Object.assign(matricula, updateMatriculaDto);
    return await this.matriculaRepository.save(matricula);
  }

  async remove(id: number) {
    const matricula = await this.findOne(id);
    await this.matriculaRepository.remove(matricula);
    return { message: `Matricula #${id} eliminada correctamente` };
  }
}
