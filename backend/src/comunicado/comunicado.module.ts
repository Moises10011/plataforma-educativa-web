import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComunicadoService } from './comunicado.service';
import { ComunicadoController } from './comunicado.controller';
import { Comunicado } from './entities/comunicado.entity';
import { Destinatario } from '../destinatario/entities/destinatario.entity';
import { AdjuntoModule } from '../adjunto/adjunto.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comunicado, Destinatario]),
    AdjuntoModule,
  ],
  controllers: [ComunicadoController],
  providers: [ComunicadoService],
  exports: [ComunicadoService],
})
export class ComunicadoModule {}
