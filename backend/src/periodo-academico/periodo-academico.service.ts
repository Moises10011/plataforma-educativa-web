import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PeriodoAcademico } from './entities/periodo-academico.entity';
import { CreatePeriodoAcademicoDto } from './dto/create-periodo-academico.dto';
import { UpdatePeriodoAcademicoDto } from './dto/update-periodo-academico.dto';

@Injectable()
export class PeriodoAcademicoService {
  constructor(
    @InjectRepository(PeriodoAcademico)
    private readonly periodoRepository: Repository<PeriodoAcademico>,
  ) {}

  async create(createPeriodoAcademicoDto: CreatePeriodoAcademicoDto) {
    const periodo = this.periodoRepository.create(createPeriodoAcademicoDto);
    return await this.periodoRepository.save(periodo);
  }

  findAll() {
    return this.periodoRepository.find();
  }

  async findOne(id: number) {
    const periodo = await this.periodoRepository.findOneBy({ id_periodo: id });
    if (!periodo) throw new NotFoundException(`Periodo #${id} no encontrado`);
    return periodo;
  }

  async update(
    id: number,
    updatePeriodoAcademicoDto: UpdatePeriodoAcademicoDto,
  ) {
    const periodo = await this.findOne(id);
    Object.assign(periodo, updatePeriodoAcademicoDto);
    return await this.periodoRepository.save(periodo);
  }

  async remove(id: number) {
    const periodo = await this.findOne(id);
    await this.periodoRepository.remove(periodo);
    return { message: `Periodo #${id} eliminado correctamente` };
  }
}
