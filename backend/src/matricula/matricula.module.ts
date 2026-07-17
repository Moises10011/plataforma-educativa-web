import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Matricula } from './entities/matricula.entity';
import { MatriculaService } from './matricula.service';
import { MatriculaController } from './matricula.controller';
import { AsignacionCurso } from '../asignacion-curso/entities/asignacion-curso.entity';
import { Grado } from '../grado/entities/grado.entity';
import { Seccion } from '../seccion/entities/seccion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Matricula, AsignacionCurso, Grado, Seccion]),
  ],
  controllers: [MatriculaController],
  providers: [MatriculaService],
})
export class MatriculaModule {}
