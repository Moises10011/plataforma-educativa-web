import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { join } from 'path';

import { DocumentoInstitucional } from './entities/documento-institucional.entity';
import { CreateDocumentoInstitucionalDto } from './dto/create-documento-institucional.dto';
import { UpdateDocumentoInstitucionalDto } from './dto/update-documento-institucional.dto';

export interface AuthUser {
  id_usuario: number;
  roles?: string[];
}

@Injectable()
export class DocumentoInstitucionalService {
  constructor(
    @InjectRepository(DocumentoInstitucional)
    private readonly documentoRepository: Repository<DocumentoInstitucional>,
  ) {}

  async create(
    dto: CreateDocumentoInstitucionalDto,
    authUser: AuthUser,
    archivo?: Express.Multer.File,
  ) {
    if (!archivo) {
      throw new BadRequestException('El archivo es obligatorio');
    }
    const documento = this.documentoRepository.create({
      ...dto,
      id_usuario_admin: authUser.id_usuario,
      archivo: archivo.filename,
    });
    return await this.documentoRepository.save(documento);
  }

  findAll() {
    return this.documentoRepository.find({
      relations: { admin: true },
      order: { fecha_subida: 'DESC' },
    });
  }

  async findOne(id: number) {
    const documento = await this.documentoRepository.findOne({
      where: { id_documento: id },
      relations: { admin: true },
    });
    if (!documento)
      throw new NotFoundException(`Documento #${id} no encontrado`);
    return documento;
  }

  async update(
    id: number,
    dto: UpdateDocumentoInstitucionalDto,
    archivo?: Express.Multer.File,
  ) {
    const documento = await this.findOne(id);

    if (archivo && documento.archivo) {
      const rutaAnterior = join(
        process.cwd(),
        'uploads',
        'documentos-institucionales',
        documento.archivo,
      );
      try {
        await unlink(rutaAnterior);
      } catch {
        // si no existe el archivo anterior, continuamos sin problema
      }
    }

    Object.assign(documento, dto);
    if (archivo) {
      documento.archivo = archivo.filename;
    }

    return await this.documentoRepository.save(documento);
  }

  async remove(id: number) {
    const documento = await this.findOne(id);

    const ruta = join(
      process.cwd(),
      'uploads',
      'documentos-institucionales',
      documento.archivo,
    );
    try {
      await unlink(ruta);
    } catch {
      // si el archivo ya no existe en disco, no detenemos el proceso
    }

    await this.documentoRepository.remove(documento);
    return { message: `Documento #${id} eliminado correctamente` };
  }
}
