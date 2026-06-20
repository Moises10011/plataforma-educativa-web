import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';

const TIPOS_PERMITIDOS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.mp4',
  '.avi',
  '.mov',
  '.mkv',
];

export function crearMulterConfig(carpetaDestino: string) {
  return {
    storage: diskStorage({
      destination: `./uploads/${carpetaDestino}`,
      filename: (
        _req: unknown,
        file: Express.Multer.File,
        callback: (error: Error | null, filename: string) => void,
      ): void => {
        const nombreUnico = `${randomUUID()}${extname(file.originalname)}`;
        callback(null, nombreUnico);
      },
    }),
    fileFilter: (
      _req: unknown,
      file: Express.Multer.File,
      callback: (error: Error | null, acceptFile: boolean) => void,
    ): void => {
      const extension = extname(file.originalname).toLowerCase();
      if (!TIPOS_PERMITIDOS.includes(extension)) {
        callback(
          new BadRequestException(
            `Tipo de archivo no permitido. Permitidos: ${TIPOS_PERMITIDOS.join(', ')}`,
          ),
          false,
        );
        return;
      }
      callback(null, true);
    },
    limits: {
      fileSize: 100 * 1024 * 1024,
    },
  };
}
