import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Matricula } from './entities/matricula.entity';
import { CreateMatriculaDto } from './dto/create-matricula.dto';
import { UpdateMatriculaDto } from './dto/update-matricula.dto';
import { AsignacionCurso } from '../asignacion-curso/entities/asignacion-curso.entity';
import { generarExcel } from '../common/utils/excel.util';
import { Grado } from '../grado/entities/grado.entity';
import { Seccion } from '../seccion/entities/seccion.entity';

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
    @InjectRepository(Grado)
    private readonly gradoRepository: Repository<Grado>,
    @InjectRepository(Seccion)
    private readonly seccionRepository: Repository<Seccion>,
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

  async exportarExcel(id_periodo: number) {
    const matriculas = await this.matriculaRepository.find({
      where: { id_periodo },
      relations: { usuario: true, grado: true, seccion: true },
    });

    const filas = matriculas.map((matricula) => ({
      id_usuario: matricula.id_usuario,
      nombre: `${matricula.usuario.nombres} ${matricula.usuario.apellidos}`,
      correo: matricula.usuario.correo,
      grado: matricula.grado.nombre,
      seccion: matricula.seccion.nombre,
      estado: matricula.estado ? 'Activo' : 'Inactivo',
    }));

    return generarExcel(
      'Matriculados',
      [
        { header: 'ID Usuario', key: 'id_usuario', width: 12 },
        { header: 'Nombre', key: 'nombre', width: 30 },
        { header: 'Correo', key: 'correo', width: 30 },
        { header: 'Grado', key: 'grado', width: 15 },
        { header: 'Seccion', key: 'seccion', width: 15 },
        { header: 'Estado', key: 'estado', width: 15 },
      ],
      filas,
    );
  }
  async distribucionPorGrado() {
    const grados = await this.gradoRepository.find({
      order: { nombre: 'ASC' },
    });

    const distribucion = await Promise.all(
      grados.map(async (grado) => {
        const cantidad = await this.matriculaRepository
          .createQueryBuilder('m')
          .where('m.id_grado = :id_grado', { id_grado: grado.id_grado })
          .andWhere('m.estado = :estado', { estado: true })
          .getCount();

        return {
          nombre: grado.nombre,
          cantidad,
        };
      }),
    );

    return distribucion;
  }

  async distribucionPorSeccion() {
    const secciones = await this.seccionRepository.find({
      order: { nombre: 'ASC' },
    });

    const distribucion = await Promise.all(
      secciones.map(async (seccion) => {
        const cantidad = await this.matriculaRepository
          .createQueryBuilder('m')
          .where('m.id_seccion = :id_seccion', {
            id_seccion: seccion.id_seccion,
          })
          .andWhere('m.estado = :estado', { estado: true })
          .getCount();

        return {
          nombre: seccion.nombre,
          cantidad,
        };
      }),
    );

    return distribucion;
  }
}
