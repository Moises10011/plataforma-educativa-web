import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AsignacionCurso } from './entities/asignacion-curso.entity';
import { CreateAsignacionCursoDto } from './dto/create-asignacion-curso.dto';
import { UpdateAsignacionCursoDto } from './dto/update-asignacion-curso.dto';

@Injectable()
export class AsignacionCursoService {
  constructor(
    @InjectRepository(AsignacionCurso)
    private readonly asignacionRepository: Repository<AsignacionCurso>,
  ) {}

  async create(createAsignacionCursoDto: CreateAsignacionCursoDto) {
    const asignacion = this.asignacionRepository.create(
      createAsignacionCursoDto,
    );
    return await this.asignacionRepository.save(asignacion);
  }

  findAll() {
    return this.asignacionRepository.find({
      relations: {
        docente: true,
        curso: true,
        grado: true,
        seccion: true,
        periodo: true,
      },
    });
  }

  async findOne(id: number) {
    const asignacion = await this.asignacionRepository.findOne({
      where: { id_asignacion: id },
      relations: {
        docente: true,
        curso: true,
        grado: true,
        seccion: true,
        periodo: true,
      },
    });
    if (!asignacion)
      throw new NotFoundException(`Asignacion #${id} no encontrada`);
    return asignacion;
  }

  async update(id: number, updateAsignacionCursoDto: UpdateAsignacionCursoDto) {
    const asignacion = await this.findOne(id);
    Object.assign(asignacion, updateAsignacionCursoDto);
    return await this.asignacionRepository.save(asignacion);
  }

  async remove(id: number) {
    const asignacion = await this.findOne(id);
    await this.asignacionRepository.remove(asignacion);
    return { message: `Asignacion #${id} eliminada correctamente` };
  }
}
