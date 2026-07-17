import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Curso } from './entities/curso.entity';
import { CursoService } from './curso.service';
import { CursoController } from './curso.controller';
import { Matricula } from '../matricula/entities/matricula.entity';
import { AsignacionCurso } from '../asignacion-curso/entities/asignacion-curso.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Curso, Matricula, AsignacionCurso])],
  controllers: [CursoController],
  providers: [CursoService],
})
export class CursoModule {}
