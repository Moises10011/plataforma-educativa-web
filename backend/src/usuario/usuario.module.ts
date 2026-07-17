import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Usuario } from './entities/usuario.entity';
import { UsuarioService } from './usuario.service';
import { UsuarioController } from './usuario.controller';
import { AsignacionCurso } from '../asignacion-curso/entities/asignacion-curso.entity';
import { Matricula } from '../matricula/entities/matricula.entity';
import { Rol } from '../rol/entities/rol.entity';
import { Nota } from '../nota/entities/nota.entity';
import { EntregaTarea } from '../entrega-tarea/entities/entrega-tarea.entity';
import { Asistencia } from '../asistencia/entities/asistencia.entity';
import { Curso } from '../curso/entities/curso.entity';
import { Tarea } from '../tarea/entities/tarea.entity';
import { Libreta } from '../libreta/entities/libreta.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      AsignacionCurso,
      Matricula,
      Rol,
      Nota,
      EntregaTarea,
      Asistencia,
      Curso,
      Tarea,
      Libreta,
    ]),
  ],
  controllers: [UsuarioController],
  providers: [UsuarioService],
  exports: [UsuarioService],
})
export class UsuarioModule {}
