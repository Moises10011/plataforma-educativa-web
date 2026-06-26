import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Horario } from './entities/horario.entity';
import { HorarioService } from './horario.service';
import { HorarioController } from './horario.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Horario])],
  controllers: [HorarioController],
  providers: [HorarioService],
})
export class HorarioModule {}
