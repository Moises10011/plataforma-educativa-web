import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Nota } from './entities/nota.entity';
import { CreateNotaDto } from './dto/create-nota.dto';
import { UpdateNotaDto } from './dto/update-nota.dto';
import { generarExcel } from '../common/utils/excel.util';
import { EntregaTarea } from '../entrega-tarea/entities/entrega-tarea.entity';
import { InjectRepository as InjectRepo } from '@nestjs/typeorm';

interface AuthUser {
  id_usuario: number;
  roles?: string[];
}

@Injectable()
export class NotaService {
  constructor(
    @InjectRepository(Nota)
    private readonly notaRepository: Repository<Nota>,
    @InjectRepo(EntregaTarea)
    private readonly entregaRepository: Repository<EntregaTarea>,
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
        relations: {
          entrega: true,
          estudiante: true,
          competencia: { curso: true },
        },
      });
    }

    return this.notaRepository.find({
      relations: {
        entrega: true,
        estudiante: true,
        competencia: { curso: true },
      },
    });
  }

  async findOne(id: number) {
    const nota = await this.notaRepository.findOne({
      where: { id_nota: id },
      relations: {
        entrega: true,
        estudiante: true,
        competencia: { curso: true },
      },
    });
    if (!nota) throw new NotFoundException(`Nota #${id} no encontrada`);
    return nota;
  }

  async findPorEstudianteYCurso(
    id_usuario_estudiante: number,
    id_curso: number,
  ) {
    const notas = await this.notaRepository.find({
      where: { id_usuario_estudiante },
      relations: { competencia: { curso: true } },
    });

    return notas.filter((nota) => nota.competencia?.id_curso === id_curso);
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

  async exportarExcel(id_asignacion: number) {
    const entregas = await this.entregaRepository.find({
      where: {},
      relations: { tarea: true },
    });

    const idsEntregasDeLaAsignacion = entregas
      .filter((entrega) => entrega.tarea?.id_asignacion === id_asignacion)
      .map((entrega) => entrega.id_entrega);

    const notas = await this.notaRepository.find({
      relations: { entrega: true, estudiante: true, competencia: true },
    });

    const notasFiltradas = notas.filter((nota) =>
      idsEntregasDeLaAsignacion.includes(nota.id_entrega),
    );

    const filas = notasFiltradas.map((nota) => ({
      id_usuario_estudiante: nota.id_usuario_estudiante,
      nombre: `${nota.estudiante.nombres} ${nota.estudiante.apellidos}`,
      competencia: nota.competencia?.nombre ?? '',
      valor: nota.valor,
      observacion: nota.observacion ?? '',
    }));

    return generarExcel(
      'Notas',
      [
        { header: 'ID Estudiante', key: 'id_usuario_estudiante', width: 15 },
        { header: 'Nombre', key: 'nombre', width: 30 },
        { header: 'Competencia', key: 'competencia', width: 40 },
        { header: 'Nota', key: 'valor', width: 10 },
        { header: 'Observacion', key: 'observacion', width: 30 },
      ],
      filas,
    );
  }

  async exportarExcelPorCurso(id_curso: number) {
    const notas = await this.notaRepository.find({
      relations: { estudiante: true, competencia: { curso: true } },
    });

    const notasFiltradas = notas.filter(
      (nota) => nota.competencia?.id_curso === id_curso,
    );

    const filas = notasFiltradas.map((nota) => ({
      id_usuario_estudiante: nota.id_usuario_estudiante,
      nombre: `${nota.estudiante.nombres} ${nota.estudiante.apellidos}`,
      competencia: nota.competencia?.nombre ?? '',
      valor: nota.valor,
      observacion: nota.observacion ?? '',
    }));

    return generarExcel(
      'Notas por curso',
      [
        { header: 'ID Estudiante', key: 'id_usuario_estudiante', width: 15 },
        { header: 'Nombre', key: 'nombre', width: 30 },
        { header: 'Competencia', key: 'competencia', width: 40 },
        { header: 'Nota', key: 'valor', width: 10 },
        { header: 'Observacion', key: 'observacion', width: 30 },
      ],
      filas,
    );
  }
}
