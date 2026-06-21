import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { join } from 'path';

import { Comunicado } from './entities/comunicado.entity';
import { CreateComunicadoDto } from './dto/create-comunicado.dto';
import { UpdateComunicadoDto } from './dto/update-comunicado.dto';

interface AuthUser {
  id_usuario: number;
  roles?: string[];
}

@Injectable()
export class ComunicadoService {
  constructor(
    @InjectRepository(Comunicado)
    private readonly comunicadoRepository: Repository<Comunicado>,
  ) {}

  async create(
    createComunicadoDto: CreateComunicadoDto,
    authUser: AuthUser,
    archivo?: Express.Multer.File,
  ) {
    const comunicado = this.comunicadoRepository.create({
      ...createComunicadoDto,
      id_usuario_admin: authUser.id_usuario,
      archivo: archivo ? archivo.filename : undefined,
    });
    return await this.comunicadoRepository.save(comunicado);
  }

  findAll() {
    return this.comunicadoRepository.find({ relations: { admin: true } });
  }

  async findOne(id: number) {
    const comunicado = await this.comunicadoRepository.findOne({
      where: { id_comunicado: id },
      relations: { admin: true },
    });
    if (!comunicado)
      throw new NotFoundException(`Comunicado #${id} no encontrado`);
    return comunicado;
  }

  async update(
    id: number,
    updateComunicadoDto: UpdateComunicadoDto,
    authUser: AuthUser,
    archivo?: Express.Multer.File,
  ) {
    const comunicado = await this.findOne(id);
    const esAdmin = authUser.roles?.includes('Administrador');
    const esPropietario = comunicado.id_usuario_admin === authUser.id_usuario;

    if (!esAdmin && !esPropietario) {
      throw new ForbiddenException(
        'No puedes modificar un comunicado de otra persona',
      );
    }

    if (archivo && comunicado.archivo) {
      const rutaAnterior = join(
        process.cwd(),
        'uploads',
        'comunicados',
        comunicado.archivo,
      );
      try {
        await unlink(rutaAnterior);
      } catch {
        // si no existe el archivo anterior, continuamos sin problema
      }
    }

    Object.assign(comunicado, updateComunicadoDto);
    if (archivo) {
      comunicado.archivo = archivo.filename;
    }

    return await this.comunicadoRepository.save(comunicado);
  }

  async remove(id: number) {
    const comunicado = await this.findOne(id);

    if (comunicado.archivo) {
      const ruta = join(
        process.cwd(),
        'uploads',
        'comunicados',
        comunicado.archivo,
      );
      try {
        await unlink(ruta);
      } catch {
        // si el archivo ya no existe en disco, no detenemos el proceso
      }
    }

    await this.comunicadoRepository.remove(comunicado);
    return { message: `Comunicado #${id} eliminado correctamente` };
  }
}
