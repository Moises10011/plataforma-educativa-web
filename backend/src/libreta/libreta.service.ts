import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { join } from 'path';

import { Libreta } from './entities/libreta.entity';
import { CreateLibretaDto } from './dto/create-libreta.dto';
import { UpdateLibretaDto } from './dto/update-libreta.dto';

@Injectable()
export class LibretaService {
  constructor(
    @InjectRepository(Libreta)
    private readonly libretaRepository: Repository<Libreta>,
  ) {}

  async create(dto: CreateLibretaDto, archivo?: Express.Multer.File) {
    if (!archivo) {
      throw new BadRequestException('El archivo es obligatorio');
    }
    const libreta = this.libretaRepository.create({
      ...dto,
      archivo: archivo.filename,
    });
    return await this.libretaRepository.save(libreta);
  }

  findAll() {
    return this.libretaRepository.find({
      relations: { estudiante: true, periodo: true },
      order: { fecha_subida: 'DESC' },
    });
  }

  async findOne(id: number) {
    const libreta = await this.libretaRepository.findOne({
      where: { id_libreta: id },
      relations: { estudiante: true, periodo: true },
    });
    if (!libreta) throw new NotFoundException(`Libreta #${id} no encontrada`);
    return libreta;
  }

  async update(
    id: number,
    dto: UpdateLibretaDto,
    archivo?: Express.Multer.File,
  ) {
    const libreta = await this.findOne(id);

    if (archivo && libreta.archivo) {
      const rutaAnterior = join(
        process.cwd(),
        'uploads',
        'libretas',
        libreta.archivo,
      );
      try {
        await unlink(rutaAnterior);
      } catch {
        // si no existe el archivo anterior, continuamos sin problema
      }
    }

    Object.assign(libreta, dto);
    if (archivo) {
      libreta.archivo = archivo.filename;
    }

    return await this.libretaRepository.save(libreta);
  }

  async remove(id: number) {
    const libreta = await this.findOne(id);

    const ruta = join(process.cwd(), 'uploads', 'libretas', libreta.archivo);
    try {
      await unlink(ruta);
    } catch {
      // si el archivo ya no existe en disco, no detenemos el proceso
    }

    await this.libretaRepository.remove(libreta);
    return { message: `Libreta #${id} eliminada correctamente` };
  }
}
