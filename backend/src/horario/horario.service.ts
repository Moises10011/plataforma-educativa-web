import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { join } from 'path';

import { Horario } from './entities/horario.entity';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { UpdateHorarioDto } from './dto/update-horario.dto';

@Injectable()
export class HorarioService {
  constructor(
    @InjectRepository(Horario)
    private readonly horarioRepository: Repository<Horario>,
  ) {}

  async create(dto: CreateHorarioDto, archivo?: Express.Multer.File) {
    if (!archivo) {
      throw new BadRequestException('El archivo es obligatorio');
    }
    const horario = this.horarioRepository.create({
      ...dto,
      archivo: archivo.filename,
    });
    return await this.horarioRepository.save(horario);
  }

  findAll() {
    return this.horarioRepository.find({
      relations: { grado: true, seccion: true, periodo: true },
      order: { fecha_subida: 'DESC' },
    });
  }

  async findOne(id: number) {
    const horario = await this.horarioRepository.findOne({
      where: { id_horario: id },
      relations: { grado: true, seccion: true, periodo: true },
    });
    if (!horario) throw new NotFoundException(`Horario #${id} no encontrado`);
    return horario;
  }

  async update(
    id: number,
    dto: UpdateHorarioDto,
    archivo?: Express.Multer.File,
  ) {
    const horario = await this.findOne(id);

    if (archivo && horario.archivo) {
      const rutaAnterior = join(
        process.cwd(),
        'uploads',
        'horarios',
        horario.archivo,
      );
      try {
        await unlink(rutaAnterior);
      } catch {
        // si no existe el archivo anterior, continuamos sin problema
      }
    }

    Object.assign(horario, dto);
    if (archivo) {
      horario.archivo = archivo.filename;
    }

    return await this.horarioRepository.save(horario);
  }

  async remove(id: number) {
    const horario = await this.findOne(id);

    const ruta = join(process.cwd(), 'uploads', 'horarios', horario.archivo);
    try {
      await unlink(ruta);
    } catch {
      // si el archivo ya no existe en disco, no detenemos el proceso
    }

    await this.horarioRepository.remove(horario);
    return { message: `Horario #${id} eliminado correctamente` };
  }
}
