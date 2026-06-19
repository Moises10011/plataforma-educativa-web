import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Nota } from './entities/nota.entity';
import { CreateNotaDto } from './dto/create-nota.dto';
import { UpdateNotaDto } from './dto/update-nota.dto';

interface AuthUser {
  id_usuario: number;
  roles?: string[];
}

@Injectable()
export class NotaService {
  constructor(
    @InjectRepository(Nota)
    private readonly notaRepository: Repository<Nota>,
  ) {}

  async create(createNotaDto: CreateNotaDto) {
    const nota = this.notaRepository.create(createNotaDto);
    return await this.notaRepository.save(nota);
  }

  async findAll(authUser: AuthUser) {
    const esEstudiante = authUser.roles?.includes('Estudiante');

    if (esEstudiante) {
      return this.notaRepository.find({
        where: { id_usuario_estudiante: authUser.id_usuario },
        relations: { entrega: true, estudiante: true },
      });
    }

    return this.notaRepository.find({
      relations: { entrega: true, estudiante: true },
    });
  }

  async findOne(id: number) {
    const nota = await this.notaRepository.findOne({
      where: { id_nota: id },
      relations: { entrega: true, estudiante: true },
    });
    if (!nota) throw new NotFoundException(`Nota #${id} no encontrada`);
    return nota;
  }

  async update(id: number, updateNotaDto: UpdateNotaDto) {
    const nota = await this.findOne(id);
    Object.assign(nota, updateNotaDto);
    return await this.notaRepository.save(nota);
  }

  async remove(id: number) {
    const nota = await this.findOne(id);
    await this.notaRepository.remove(nota);
    return { message: `Nota #${id} eliminada correctamente` };
  }
}
