import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Tarea } from './entities/tarea.entity';
import { TareaService } from './tarea.service';
import { TareaController } from './tarea.controller';
import { AsignacionCurso } from '../asignacion-curso/entities/asignacion-curso.entity';
import { Matricula } from '../matricula/entities/matricula.entity';
import { EntregaTarea } from '../entrega-tarea/entities/entrega-tarea.entity';
import { Nota } from '../nota/entities/nota.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tarea,
      AsignacionCurso,
      Matricula,
      EntregaTarea,
      Nota,
    ]),
  ],
  controllers: [TareaController],
  providers: [TareaService],
})
export class TareaModule {}
