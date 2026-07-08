import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { Adjunto } from './entities/adjunto.entity';
import type { EntidadAdjunto } from './entities/adjunto.entity';

@Injectable()
export class AdjuntoService {
  constructor(
    @InjectRepository(Adjunto)
    private readonly adjuntoRepository: Repository<Adjunto>,
  ) {}

  async guardarAdjuntos(
    entidad: EntidadAdjunto,
    entidad_id: number,
    carpeta: string,
    files: Express.Multer.File[],
  ): Promise<Adjunto[]> {
    if (!files || files.length === 0) {
      return [];
    }

    const registros = files.map((file) =>
      this.adjuntoRepository.create({
        entidad,
        entidad_id,
        carpeta,
        nombre_archivo: file.filename,
        nombre_original: file.originalname,
        mime_type: file.mimetype,
        tamano: file.size,
      }),
    );

    return this.adjuntoRepository.save(registros);
  }

  async obtenerAdjuntosDe(
    entidad: EntidadAdjunto,
    entidad_id: number,
  ): Promise<Adjunto[]> {
    return this.adjuntoRepository.find({
      where: { entidad, entidad_id },
      order: { fecha_subida: 'ASC' },
    });
  }

  async obtenerAdjuntoPorId(id: number): Promise<Adjunto> {
    const adjunto = await this.adjuntoRepository.findOne({ where: { id } });
    if (!adjunto) {
      throw new NotFoundException(`Adjunto con id ${id} no encontrado`);
    }
    return adjunto;
  }

  async obtenerRutaFisica(
    id: number,
  ): Promise<{ ruta: string; adjunto: Adjunto }> {
    const adjunto = await this.obtenerAdjuntoPorId(id);
    const ruta = join(
      process.cwd(),
      'uploads',
      adjunto.carpeta,
      adjunto.nombre_archivo,
    );
    return { ruta, adjunto };
  }

  async eliminarAdjunto(id: number): Promise<void> {
    const { ruta, adjunto } = await this.obtenerRutaFisica(id);
    try {
      await unlink(ruta);
    } catch {
      // archivo físico ya no existe, se ignora
    }
    await this.adjuntoRepository.remove(adjunto);
  }

  async eliminarTodosDe(
    entidad: EntidadAdjunto,
    entidad_id: number,
  ): Promise<void> {
    const adjuntos = await this.obtenerAdjuntosDe(entidad, entidad_id);
    for (const adjunto of adjuntos) {
      await this.eliminarAdjunto(adjunto.id);
    }
  }
}
