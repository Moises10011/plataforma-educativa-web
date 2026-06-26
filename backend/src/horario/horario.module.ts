import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HorarioService } from './horario.service';
import { HorarioController } from './horario.controller';
import { HorariosEntity } from './entities/horario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HorariosEntity])],
  controllers: [HorarioController],
  providers: [HorarioService],
})
export class HorarioModule {}