import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AsignacionCurso } from './entities/asignacion-curso.entity';
import { AsignacionCursoService } from './asignacion-curso.service';
import { AsignacionCursoController } from './asignacion-curso.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AsignacionCurso])],
  controllers: [AsignacionCursoController],
  providers: [AsignacionCursoService],
})
export class AsignacionCursoModule {}
