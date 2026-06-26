import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { join } from 'path';

import { DocumentoInstitucional } from './entities/documento-institucional.entity';
import { Destinatario } from '../destinatario/entities/destinatario.entity';
import type { TipoDestinatario } from '../destinatario/entities/destinatario.entity';
import { CreateDocumentoInstitucionalDto } from './dto/create-documento-institucional.dto';
import { UpdateDocumentoInstitucionalDto } from './dto/update-documento-institucional.dto';

export interface AuthUser {
  id_usuario: number;
  roles?: string[];
}

const CARPETA_DOCUMENTOS = join(process.cwd(), 'uploads', 'documentos');

@Injectable()
export class DocumentoInstitucionalService {
  constructor(
    @InjectRepository(DocumentoInstitucional)
    private readonly documentoRepository: Repository<DocumentoInstitucional>,
    private readonly dataSource: DataSource,
  ) {}

  private validarConsistenciaTipo(datos: {
    tipo?: TipoDestinatario;
    id_grado?: number | null;
    id_seccion?: number | null;
    id_usuario?: number | null;
  }) {
    const { tipo, id_grado, id_seccion, id_usuario } = datos;

    if (tipo === 'todos' && (id_grado || id_seccion || id_usuario)) {
      throw new BadRequestException(
        'Cuando tipo es "todos", no debe incluir id_grado, id_seccion ni id_usuario.',
      );
    }

    if (tipo === 'estudiantes') {
      if (!id_grado) {
        throw new BadRequestException(
          'Cuando tipo es "estudiantes", id_grado es obligatorio.',
        );
      }
      if (id_usuario) {
        throw new BadRequestException(
          'Cuando tipo es "estudiantes", no debe incluir id_usuario.',
        );
      }
    }

    if (tipo === 'docentes' && (id_grado || id_seccion)) {
      throw new BadRequestException(
        'Cuando tipo es "docentes", no debe incluir id_grado ni id_seccion.',
      );
    }
  }

  async create(
    dto: CreateDocumentoInstitucionalDto,
    authUser: AuthUser,
    archivo?: Express.Multer.File,
  ) {
    if (!archivo) {
      throw new BadRequestException('El archivo es obligatorio.');
    }

    this.validarConsistenciaTipo(dto);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const documento = queryRunner.manager.create(DocumentoInstitucional, {
        titulo: dto.titulo,
        descripcion: dto.descripcion ?? undefined,
        archivo: archivo.filename,
        id_usuario_admin: authUser.id_usuario,
      });
      const documentoGuardado = await queryRunner.manager.save(documento);

      const destinatario = queryRunner.manager.create(Destinatario, {
        entidad: 'documento_institucional',
        entidad_id: documentoGuardado.id_documento,
        tipo: dto.tipo,
        id_grado: dto.tipo === 'estudiantes' ? (dto.id_grado ?? null) : null,
        id_seccion:
          dto.tipo === 'estudiantes' ? (dto.id_seccion ?? null) : null,
        id_usuario: dto.tipo === 'docentes' ? (dto.id_usuario ?? null) : null,
      });
      await queryRunner.manager.save(destinatario);

      await queryRunner.commitTransaction();
      return documentoGuardado;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await this.eliminarArchivoFisico(archivo.filename);

      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'No se pudo crear el documento institucional.',
      );
    } finally {
      await queryRunner.release();
    }
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
    if (!documento) {
      throw new NotFoundException(`Documento #${id} no encontrado.`);
    }
    return documento;
  }

  async update(
    id: number,
    dto: UpdateDocumentoInstitucionalDto,
    archivo?: Express.Multer.File,
  ) {
    const documento = await this.findOne(id);

    if (dto.tipo) {
      this.validarConsistenciaTipo(dto);
    }

    if (archivo && documento.archivo) {
      await this.eliminarArchivoFisico(documento.archivo);
    }

    if (dto.titulo !== undefined) documento.titulo = dto.titulo;
    if (dto.descripcion !== undefined) documento.descripcion = dto.descripcion;
    if (archivo) documento.archivo = archivo.filename;

    const documentoActualizado = await this.documentoRepository.save(documento);

    if (dto.tipo) {
      await this.dataSource.getRepository(Destinatario).update(
        { entidad: 'documento_institucional', entidad_id: id },
        {
          tipo: dto.tipo,
          id_grado: dto.tipo === 'estudiantes' ? (dto.id_grado ?? null) : null,
          id_seccion:
            dto.tipo === 'estudiantes' ? (dto.id_seccion ?? null) : null,
          id_usuario: dto.tipo === 'docentes' ? (dto.id_usuario ?? null) : null,
        },
      );
    }

    return documentoActualizado;
  }

  async remove(id: number) {
    const documento = await this.findOne(id);

    await this.dataSource.getRepository(Destinatario).delete({
      entidad: 'documento_institucional',
      entidad_id: id,
    });

    await this.eliminarArchivoFisico(documento.archivo);
    await this.documentoRepository.remove(documento);

    return { message: `Documento #${id} eliminado correctamente.` };
  }

  getRutaArchivo(nombreArchivo: string): string {
    return join(CARPETA_DOCUMENTOS, nombreArchivo);
  }

  private async eliminarArchivoFisico(nombreArchivo: string) {
    try {
      await unlink(join(CARPETA_DOCUMENTOS, nombreArchivo));
    } catch {
      // si el archivo no existe en disco, no se detiene el proceso
    }
  }
}
