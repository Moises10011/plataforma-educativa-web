import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Comunicado } from './entities/comunicado.entity';
import { ComunicadoService } from './comunicado.service';
import { ComunicadoController } from './comunicado.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Comunicado])],
  controllers: [ComunicadoController],
  providers: [ComunicadoService],
})
export class ComunicadoModule {}
