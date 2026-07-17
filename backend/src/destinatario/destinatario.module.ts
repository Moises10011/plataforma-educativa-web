import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Destinatario } from './entities/destinatario.entity';
import { Comunicado } from '../comunicado/entities/comunicado.entity';
import { DocumentoInstitucional } from '../documento-institucional/entities/documento-institucional.entity';
import { DestinatarioService } from './destinatario.service';
import { DestinatarioController } from './destinatario.controller';
import { Matricula } from '../matricula/entities/matricula.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Destinatario,
      Comunicado,
      DocumentoInstitucional,
      Matricula,
    ]),
  ],
  controllers: [DestinatarioController],
  providers: [DestinatarioService],
  exports: [DestinatarioService],
})
export class DestinatarioModule {}
