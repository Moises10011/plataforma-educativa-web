import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { join } from 'path';

import { EntregaTarea } from './entities/entrega-tarea.entity';
import { CreateEntregaTareaDto } from './dto/create-entrega-tarea.dto';
import { UpdateEntregaTareaDto } from './dto/update-entrega-tarea.dto';

interface AuthUser {
  id_usuario: number;
  roles?: string[];
}

@Injectable()
export class EntregaTareaService {
  constructor(
    @InjectRepository(EntregaTarea)
    private readonly entregaRepository: Repository<EntregaTarea>,
  ) {}

  async create(
    createEntregaTareaDto: CreateEntregaTareaDto,
    authUser: AuthUser,
    archivo?: Express.Multer.File,
  ) {
    if (createEntregaTareaDto.id_usuario_estudiante !== authUser.id_usuario) {
      throw new ForbiddenException(
        'No puedes entregar una tarea en nombre de otro estudiante',
      );
    }

    const entrega = this.entregaRepository.create({
      ...createEntregaTareaDto,
      archivo: archivo ? archivo.filename : undefined,
    });
    return await this.entregaRepository.save(entrega);
  }

  async findAll(authUser: AuthUser) {
    const esEstudiante = authUser.roles?.includes('Estudiante');

    if (esEstudiante) {
      return this.entregaRepository.find({
        where: { id_usuario_estudiante: authUser.id_usuario },
        relations: { tarea: true, estudiante: true },
      });
    }

    return this.entregaRepository.find({
      relations: { tarea: true, estudiante: true },
    });
  }

  async findOne(id: number) {
    const entrega = await this.entregaRepository.findOne({
      where: { id_entrega: id },
      relations: { tarea: true, estudiante: true },
    });
    if (!entrega) throw new NotFoundException(`Entrega #${id} no encontrada`);
    return entrega;
  }

  async update(
    id: number,
    updateEntregaTareaDto: UpdateEntregaTareaDto,
    authUser: AuthUser,
    archivo?: Express.Multer.File,
  ) {
    const entrega = await this.findOne(id);

    if (entrega.id_usuario_estudiante !== authUser.id_usuario) {
      throw new ForbiddenException(
        'No puedes modificar la entrega de otro estudiante',
      );
    }

    if (archivo && entrega.archivo) {
      const rutaAnterior = join(
        process.cwd(),
        'uploads',
        'entregas',
        entrega.archivo,
      );
      try {
        await unlink(rutaAnterior);
      } catch {
        // si no existe el archivo anterior, continuamos sin problema
      }
    }

    Object.assign(entrega, updateEntregaTareaDto);
    if (archivo) {
      entrega.archivo = archivo.filename;
    }

    return await this.entregaRepository.save(entrega);
  }

  async remove(id: number) {
    const entrega = await this.findOne(id);

    if (entrega.archivo) {
      const ruta = join(process.cwd(), 'uploads', 'entregas', entrega.archivo);
      try {
        await unlink(ruta);
      } catch {
        // si el archivo ya no existe en disco, no detenemos el proceso
      }
    }

    await this.entregaRepository.remove(entrega);
    return { message: `Entrega #${id} eliminada correctamente` };
  }
}
