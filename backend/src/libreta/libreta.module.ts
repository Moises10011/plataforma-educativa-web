import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Libreta } from './entities/libreta.entity';
import { LibretaService } from './libreta.service';
import { LibretaController } from './libreta.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Libreta])],
  controllers: [LibretaController],
  providers: [LibretaService],
})
export class LibretaModule {}
