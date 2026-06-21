import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { join } from 'path';

import { Institucion } from './entities/institucion.entity';
import { UpdateInstitucionDto } from './dto/update-institucion.dto';

@Injectable()
export class InstitucionService {
  constructor(
    @InjectRepository(Institucion)
    private readonly institucionRepository: Repository<Institucion>,
  ) {}

  async obtener() {
    const institucion = await this.institucionRepository.findOne({
      where: {},
      order: { id_institucion: 'ASC' },
    });
    if (!institucion) {
      throw new NotFoundException(
        'No se ha configurado la informacion de la institucion',
      );
    }
    return institucion;
  }

  async actualizar(
    updateInstitucionDto: UpdateInstitucionDto,
    logo?: Express.Multer.File,
  ) {
    const institucion = await this.obtener();

    if (logo && institucion.logo) {
      const rutaAnterior = join(
        process.cwd(),
        'uploads',
        'institucion',
        institucion.logo,
      );
      try {
        await unlink(rutaAnterior);
      } catch {
        // si no existe el logo anterior, continuamos sin problema
      }
    }

    Object.assign(institucion, updateInstitucionDto);
    if (logo) {
      institucion.logo = logo.filename;
    }

    return await this.institucionRepository.save(institucion);
  }
}
