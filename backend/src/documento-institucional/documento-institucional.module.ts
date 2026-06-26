import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuid } from 'uuid';

import { DocumentoInstitucional } from './entities/documento-institucional.entity';
import { Destinatario } from '../destinatario/entities/destinatario.entity';
import { DocumentoInstitucionalService } from './documento-institucional.service';
import { DocumentoInstitucionalController } from './documento-institucional.controller';

const CARPETA_DOCUMENTOS = join(process.cwd(), 'uploads', 'documentos');

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentoInstitucional, Destinatario]),
    MulterModule.register({
      storage: diskStorage({
        destination: CARPETA_DOCUMENTOS,
        filename: (_req, file, cb) => {
          cb(null, `${uuid()}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const permitidos = /pdf|doc|docx|xls|xlsx|ppt|pptx/;
        const valido = permitidos.test(
          extname(file.originalname).toLowerCase(),
        );
        if (valido) {
          cb(null, true);
        } else {
          cb(new Error('Tipo de archivo no permitido'), false);
        }
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  ],
  controllers: [DocumentoInstitucionalController],
  providers: [DocumentoInstitucionalService],
})
export class DocumentoInstitucionalModule {}
