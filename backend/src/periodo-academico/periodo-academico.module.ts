import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PeriodoAcademico } from './entities/periodo-academico.entity';
import { PeriodoAcademicoService } from './periodo-academico.service';
import { PeriodoAcademicoController } from './periodo-academico.controller';
import { BimestreModule } from '../bimestre/bimestre.module';

@Module({
  imports: [TypeOrmModule.forFeature([PeriodoAcademico]), BimestreModule],
  controllers: [PeriodoAcademicoController],
  providers: [PeriodoAcademicoService],
})
export class PeriodoAcademicoModule {}
