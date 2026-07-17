import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bimestre } from './entities/bimestre.entity';
import { CreateBimestreDto } from './dto/create-bimestre.dto';
import { TipoPeriodo } from '../periodo-academico/entities/periodo-academico.entity';

const NOMBRES_POR_TIPO: Record<TipoPeriodo, string[]> = {
  bimestral: ['I Bimestre', 'II Bimestre', 'III Bimestre', 'IV Bimestre'],
  trimestral: ['I Trimestre', 'II Trimestre', 'III Trimestre'],
};

@Injectable()
export class BimestreService {
  constructor(
    @InjectRepository(Bimestre)
    private readonly bimestreRepo: Repository<Bimestre>,
  ) {}

  create(dto: CreateBimestreDto) {
    const bimestre = this.bimestreRepo.create(dto);
    return this.bimestreRepo.save(bimestre);
  }

  findByPeriodo(id_periodo: number) {
    return this.bimestreRepo.find({
      where: { id_periodo, estado: true },
      order: { id_bimestre: 'ASC' },
    });
  }

  /**
   * Genera automáticamente los bimestres/trimestres de un periodo académico
   * recién creado. Se llama desde PeriodoAcademicoService.create().
   */
  async crearParaPeriodo(id_periodo: number, tipo: TipoPeriodo) {
    const nombres = NOMBRES_POR_TIPO[tipo];
    const bimestres = nombres.map((nombre) =>
      this.bimestreRepo.create({ id_periodo, nombre, estado: true }),
    );
    return this.bimestreRepo.save(bimestres);
  }

  /**
   * Elimina los bimestres asociados a un periodo (usar antes de borrar
   * un periodo académico, si PeriodoAcademicoService.remove() lo permite).
   */
  async eliminarPorPeriodo(id_periodo: number) {
    await this.bimestreRepo.delete({ id_periodo });
  }
}
