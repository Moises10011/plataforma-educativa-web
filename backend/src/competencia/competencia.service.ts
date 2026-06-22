import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Competencia } from './entities/competencia.entity';
import { CreateCompetenciaDto } from './dto/create-competencia.dto';
import { UpdateCompetenciaDto } from './dto/update-competencia.dto';

@Injectable()
export class CompetenciaService {
  constructor(
    @InjectRepository(Competencia)
    private readonly competenciaRepository: Repository<Competencia>,
  ) {}

  async create(createCompetenciaDto: CreateCompetenciaDto) {
    const competencia = this.competenciaRepository.create(createCompetenciaDto);
    return await this.competenciaRepository.save(competencia);
  }

  findAll(id_curso?: number) {
    if (id_curso) {
      return this.competenciaRepository.find({
        where: { id_curso },
        relations: { curso: true },
      });
    }
    return this.competenciaRepository.find({ relations: { curso: true } });
  }

  async findOne(id: number) {
    const competencia = await this.competenciaRepository.findOne({
      where: { id_competencia: id },
      relations: { curso: true },
    });
    if (!competencia)
      throw new NotFoundException(`Competencia #${id} no encontrada`);
    return competencia;
  }

  async update(id: number, updateCompetenciaDto: UpdateCompetenciaDto) {
    const competencia = await this.findOne(id);
    Object.assign(competencia, updateCompetenciaDto);
    return await this.competenciaRepository.save(competencia);
  }

  async remove(id: number) {
    const competencia = await this.findOne(id);
    await this.competenciaRepository.remove(competencia);
    return { message: `Competencia #${id} eliminada correctamente` };
  }
}
