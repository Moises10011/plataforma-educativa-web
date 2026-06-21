import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Asistencia } from './entities/asistencia.entity';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { UpdateAsistenciaDto } from './dto/update-asistencia.dto';
import { generarExcel, leerExcel } from '../common/utils/excel.util';

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

  async exportarExcel(id_asignacion: number) {
    const registros = await this.asistenciaRepository.find({
      where: { id_asignacion },
      relations: { estudiante: true },
    });

    const filas = registros.map((registro) => ({
      id_usuario_estudiante: registro.id_usuario_estudiante,
      nombre: `${registro.estudiante.nombres} ${registro.estudiante.apellidos}`,
      fecha: registro.fecha,
      estado: registro.estado,
    }));

    return generarExcel(
      'Asistencia',
      [
        { header: 'ID Estudiante', key: 'id_usuario_estudiante', width: 15 },
        { header: 'Nombre', key: 'nombre', width: 30 },
        { header: 'Fecha', key: 'fecha', width: 15 },
        { header: 'Estado', key: 'estado', width: 15 },
      ],
      filas,
    );
  }

  async importarExcel(id_asignacion: number, buffer: Buffer) {
    const filas = await leerExcel(buffer);

    const resultados: { fila: number; mensaje: string }[] = [];
    let creados = 0;

    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i];

      const id_usuario_estudiante = Number(fila['ID Estudiante']);
      const fecha = fila['Fecha'];
      const estado = fila['Estado'];

      if (!id_usuario_estudiante || !fecha || !estado) {
        resultados.push({
          fila: i + 2,
          mensaje: 'Faltan datos requeridos en esta fila',
        });
        continue;
      }

      try {
        const asistencia = this.asistenciaRepository.create({
          id_asignacion,
          id_usuario_estudiante,
          fecha: new Date(fecha),
          estado,
        });
        await this.asistenciaRepository.save(asistencia);
        creados++;
      } catch {
        resultados.push({ fila: i + 2, mensaje: 'Error al guardar esta fila' });
      }
    }

    if (creados === 0 && resultados.length > 0) {
      throw new BadRequestException({
        message: 'No se pudo importar ningun registro',
        errores: resultados,
      });
    }

    return {
      message: `Se importaron ${creados} registros de asistencia correctamente`,
      errores: resultados,
    };
  }
}
