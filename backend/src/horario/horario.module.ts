import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Horario } from './entities/horario.entity';
import { HorarioService } from './horario.service';
import { HorarioController } from './horario.controller';
import { UsuarioModule } from '../usuario/usuario.module';
import { Matricula } from '../matricula/entities/matricula.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Horario, Matricula]), UsuarioModule],
  controllers: [HorarioController],
  providers: [HorarioService],
})
export class HorarioModule {}
