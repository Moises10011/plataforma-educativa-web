import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Matricula } from './entities/matricula.entity';
import { CreateMatriculaDto } from './dto/create-matricula.dto';
import { UpdateMatriculaDto } from './dto/update-matricula.dto';
import { AsignacionCurso } from '../asignacion-curso/entities/asignacion-curso.entity';

interface AuthUser {
  id_usuario: number;
  roles?: string[];
}

@Injectable()
export class MatriculaService {
  constructor(
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
    @InjectRepository(AsignacionCurso)
    private readonly asignacionRepository: Repository<AsignacionCurso>,
  ) {}

  async create(createMatriculaDto: CreateMatriculaDto) {
    const matricula = this.matriculaRepository.create(createMatriculaDto);
    return await this.matriculaRepository.save(matricula);
  }

  async findAll(authUser: AuthUser) {
    const esAdmin = authUser.roles?.includes('Administrador');
    const esDocente = authUser.roles?.includes('Docente');
    const esEstudiante = authUser.roles?.includes('Estudiante');

    if (esAdmin) {
      return this.matriculaRepository.find({
        relations: { usuario: true, grado: true, seccion: true, periodo: true },
      });
    }

    if (esEstudiante) {
      return this.matriculaRepository.find({
        where: { id_usuario: authUser.id_usuario },
        relations: { usuario: true, grado: true, seccion: true, periodo: true },
      });
    }

    if (esDocente) {
      const asignaciones = await this.asignacionRepository.find({
        where: { id_usuario_docente: authUser.id_usuario },
      });

      const combinaciones = asignaciones.map((a) => ({
        id_grado: a.id_grado,
        id_seccion: a.id_seccion,
        id_periodo: a.id_periodo,
      }));

      const todas = await this.matriculaRepository.find({
        relations: { usuario: true, grado: true, seccion: true, periodo: true },
      });

      return todas.filter((m) =>
        combinaciones.some(
          (c) =>
            c.id_grado === m.id_grado &&
            c.id_seccion === m.id_seccion &&
            c.id_periodo === m.id_periodo,
        ),
      );
    }

    return [];
  }

  async findOne(id: number) {
    const matricula = await this.matriculaRepository.findOne({
      where: { id_matricula: id },
      relations: { usuario: true, grado: true, seccion: true, periodo: true },
    });
    if (!matricula)
      throw new NotFoundException(`Matricula #${id} no encontrada`);
    return matricula;
  }

  async update(id: number, updateMatriculaDto: UpdateMatriculaDto) {
    const matricula = await this.findOne(id);
    Object.assign(matricula, updateMatriculaDto);
    return await this.matriculaRepository.save(matricula);
  }

  async remove(id: number) {
    const matricula = await this.findOne(id);
    await this.matriculaRepository.remove(matricula);
    return { message: `Matricula #${id} eliminada correctamente` };
  }
}
