import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { join } from 'path';

import { Galeria } from './entities/galeria.entity';
import { CreateGaleriaDto } from './dto/create-galeria.dto';
import { UpdateGaleriaDto } from './dto/update-galeria.dto';

@Injectable()
export class GaleriaService {
  constructor(
    @InjectRepository(Galeria)
    private readonly galeriaRepository: Repository<Galeria>,
  ) {}

  async create(
    createGaleriaDto: CreateGaleriaDto,
    imagen?: Express.Multer.File,
  ) {
    const galeria = this.galeriaRepository.create({
      ...createGaleriaDto,
      imagen: imagen ? imagen.filename : undefined,
    });
    return await this.galeriaRepository.save(galeria);
  }

  findAll(tipo?: string) {
    if (tipo) {
      return this.galeriaRepository.find({
        where: { tipo, estado: true },
        order: { fecha_publicacion: 'DESC' },
      });
    }
    return this.galeriaRepository.find({
      where: { estado: true },
      order: { fecha_publicacion: 'DESC' },
    });
  }

  async findOne(id: number) {
    const galeria = await this.galeriaRepository.findOneBy({ id_galeria: id });
    if (!galeria)
      throw new NotFoundException(`Imagen de galeria #${id} no encontrada`);
    return galeria;
  }

  async update(
    id: number,
    updateGaleriaDto: UpdateGaleriaDto,
    imagen?: Express.Multer.File,
  ) {
    const galeria = await this.findOne(id);

    if (imagen && galeria.imagen) {
      const rutaAnterior = join(
        process.cwd(),
        'uploads',
        'galeria',
        galeria.imagen,
      );
      try {
        await unlink(rutaAnterior);
      } catch {
        // si no existe la imagen anterior, continuamos sin problema
      }
    }

    Object.assign(galeria, updateGaleriaDto);
    if (imagen) {
      galeria.imagen = imagen.filename;
    }

    return await this.galeriaRepository.save(galeria);
  }

  async remove(id: number) {
    const galeria = await this.findOne(id);

    if (galeria.imagen) {
      const ruta = join(process.cwd(), 'uploads', 'galeria', galeria.imagen);
      try {
        await unlink(ruta);
      } catch {
        // si la imagen ya no existe en disco, no detenemos el proceso
      }
    }

    await this.galeriaRepository.remove(galeria);
    return { message: `Imagen de galeria #${id} eliminada correctamente` };
  }
}
