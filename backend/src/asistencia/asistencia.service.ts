import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Asistencia } from './entities/asistencia.entity';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { UpdateAsistenciaDto } from './dto/update-asistencia.dto';

interface AuthUser {
  id_usuario: number;
  roles?: string[];
}

@Injectable()
export class AsistenciaService {
  constructor(
    @InjectRepository(Asistencia)
    private readonly asistenciaRepository: Repository<Asistencia>,
  ) {}

  async create(createAsistenciaDto: CreateAsistenciaDto) {
    const asistencia = this.asistenciaRepository.create(createAsistenciaDto);
    return await this.asistenciaRepository.save(asistencia);
  }

  async findAll(authUser: AuthUser) {
    const esEstudiante = authUser.roles?.includes('Estudiante');

    if (esEstudiante) {
      return this.asistenciaRepository.find({
        where: { id_usuario_estudiante: authUser.id_usuario },
        relations: { asignacion: true, estudiante: true },
      });
    }

    return this.asistenciaRepository.find({
      relations: { asignacion: true, estudiante: true },
    });
  }

  async findOne(id: number) {
    const asistencia = await this.asistenciaRepository.findOne({
      where: { id_asistencia: id },
      relations: { asignacion: true, estudiante: true },
    });
    if (!asistencia)
      throw new NotFoundException(`Asistencia #${id} no encontrada`);
    return asistencia;
  }

  async update(id: number, updateAsistenciaDto: UpdateAsistenciaDto) {
    const asistencia = await this.findOne(id);
    Object.assign(asistencia, updateAsistenciaDto);
    return await this.asistenciaRepository.save(asistencia);
  }

  async remove(id: number) {
    const asistencia = await this.findOne(id);
    await this.asistenciaRepository.remove(asistencia);
    return { message: `Asistencia #${id} eliminada correctamente` };
  }
}
