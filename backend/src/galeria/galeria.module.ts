import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Galeria } from './entities/galeria.entity';
import { GaleriaService } from './galeria.service';
import { GaleriaController } from './galeria.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Galeria])],
  controllers: [GaleriaController],
  providers: [GaleriaService],
})
export class GaleriaModule {}
