import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Libreta } from './entities/libreta.entity';
import { LibretaService } from './libreta.service';
import { LibretaController } from './libreta.controller';
import { Matricula } from '../matricula/entities/matricula.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Libreta, Matricula])],
  controllers: [LibretaController],
  providers: [LibretaService],
})
export class LibretaModule {}
