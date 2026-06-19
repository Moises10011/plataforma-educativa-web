import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Tarea } from './entities/tarea.entity';
import { TareaService } from './tarea.service';
import { TareaController } from './tarea.controller';
import { AsignacionCurso } from '../asignacion-curso/entities/asignacion-curso.entity';
import { Matricula } from '../matricula/entities/matricula.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tarea, AsignacionCurso, Matricula])],
  controllers: [TareaController],
  providers: [TareaService],
})
export class TareaModule {}
