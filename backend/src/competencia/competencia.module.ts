import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Competencia } from './entities/competencia.entity';
import { CompetenciaService } from './competencia.service';
import { CompetenciaController } from './competencia.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Competencia])],
  controllers: [CompetenciaController],
  providers: [CompetenciaService],
})
export class CompetenciaModule {}
