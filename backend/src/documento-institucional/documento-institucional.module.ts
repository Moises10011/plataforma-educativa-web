import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DocumentoInstitucional } from './entities/documento-institucional.entity';
import { DocumentoInstitucionalService } from './documento-institucional.service';
import { DocumentoInstitucionalController } from './documento-institucional.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentoInstitucional])],
  controllers: [DocumentoInstitucionalController],
  providers: [DocumentoInstitucionalService],
})
export class DocumentoInstitucionalModule {}
