import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Usuario } from './entities/usuario.entity';
import { UsuarioService } from './usuario.service';
import { UsuarioController } from './usuario.controller';
import { AsignacionCurso } from '../asignacion-curso/entities/asignacion-curso.entity';
import { Matricula } from '../matricula/entities/matricula.entity';
import { Rol } from '../rol/entities/rol.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, AsignacionCurso, Matricula, Rol]),
  ],
  controllers: [UsuarioController],
  providers: [UsuarioService],
  exports: [UsuarioService],
})
export class UsuarioModule {}
