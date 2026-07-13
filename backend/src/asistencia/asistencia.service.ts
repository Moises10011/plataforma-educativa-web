import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';

import { Asistencia } from './entities/asistencia.entity';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { UpdateAsistenciaDto } from './dto/update-asistencia.dto';
import { generarExcel, leerExcel } from '../common/utils/excel.util';
import { Matricula } from '../matricula/entities/matricula.entity';
import { AsignacionCurso } from '../asignacion-curso/entities/asignacion-curso.entity';
import { Usuario } from '../usuario/entities/usuario.entity';

interface AuthUser {
  id_usuario: number;
  roles?: string[];
}

export interface DiaDelMes {
  fecha: string;
  dia_semana: string;
  numero: number;
}

export interface ResumenAsistencia {
  total_dias: number;
  presentes: number;
  ausentes: number;
  tardanzas: number;
  justificados: number;
  porcentaje: number;
}

export interface EstudianteConAsistencia {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  asistencia_diaria: Record<string, string | null>;
  resumen: ResumenAsistencia;
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

  async getAsistenciaMes(
    id_asignacion: number,
    mes: number,
    anio: number,
    id_docente: number,
  ) {
    const matriculaRepo =
      this.asistenciaRepository.manager.getRepository(Matricula);
    const asignacionRepo =
      this.asistenciaRepository.manager.getRepository(AsignacionCurso);
    const usuarioRepo =
      this.asistenciaRepository.manager.getRepository(Usuario);
    const asignacion = await asignacionRepo.findOne({
      where: { id_asignacion, id_usuario_docente: id_docente },
      relations: { curso: true, grado: true, seccion: true, periodo: true },
    });

    if (!asignacion) {
      throw new NotFoundException('Asignación no encontrada');
    }

    // Obtener estudiantes matriculados
    const matriculas = await matriculaRepo.find({
      where: {
        id_grado: asignacion.id_grado,
        id_seccion: asignacion.id_seccion,
        id_periodo: asignacion.id_periodo,
        estado: true,
      },
      relations: { usuario: true },
    });

    // Obtener todos los registros de asistencia del mes para esta asignación
    const inicioMes = new Date(anio, mes - 1, 1);
    const finMes = new Date(anio, mes, 0);
    const registrosAsistencia = await this.asistenciaRepository.find({
      where: {
        id_asignacion,
        fecha: Between(inicioMes, finMes),
      },
      relations: { estudiante: true },
    });

    // Obtener todos los usuarios (estudiantes) de las matrículas
    const idsEstudiantes = matriculas.map((m) => m.id_usuario);
    const estudiantes = idsEstudiantes.length
      ? await usuarioRepo.find({
          where: { id_usuario: In(idsEstudiantes) },
        })
      : [];

    // Generar días del mes
    const diasDelMes: DiaDelMes[] = [];
    const totalDias = new Date(anio, mes, 0).getDate();
    for (let dia = 1; dia <= totalDias; dia++) {
      const fecha = new Date(anio, mes - 1, dia);
      const diaSemana = fecha.getDay();
      diasDelMes.push({
        fecha: `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
        dia_semana: ['D', 'L', 'M', 'M', 'J', 'V', 'S'][diaSemana],
        numero: dia,
      });
    }

    // Construir respuesta
    const estudiantesConAsistencia: EstudianteConAsistencia[] = estudiantes.map(
      (estudiante) => {
        const asistenciaEstudiante: Record<string, string | null> = {};
        let presentes = 0;
        let ausentes = 0;
        let tardanzas = 0;
        let justificados = 0;

        // Inicializar todos los días como vacíos
        diasDelMes.forEach((dia) => {
          asistenciaEstudiante[dia.fecha] = null;
        });

        // Llenar con los registros existentes
        registrosAsistencia
          .filter((r) => r.id_usuario_estudiante === estudiante.id_usuario)
          .forEach((registro) => {
            const fechaStr = registro.fecha.toISOString().split('T')[0];
            asistenciaEstudiante[fechaStr] = registro.estado;
            if (registro.estado === 'presente') presentes++;
            else if (registro.estado === 'ausente') ausentes++;
            else if (registro.estado === 'tardanza') tardanzas++;
            else if (registro.estado === 'justificado') justificados++;
          });

        const totalMarcados = presentes + ausentes + tardanzas + justificados;
        const porcentaje =
          totalMarcados > 0 ? Math.round((presentes / totalMarcados) * 100) : 0;

        return {
          id_usuario: estudiante.id_usuario,
          nombres: estudiante.nombres,
          apellidos: estudiante.apellidos,
          asistencia_diaria: asistenciaEstudiante,
          resumen: {
            total_dias: totalDias,
            presentes,
            ausentes,
            tardanzas,
            justificados,
            porcentaje,
          },
        };
      },
    );

    return {
      encabezado: {
        institucion: 'Institución Educativa',
        docente: `${asignacion.docente?.nombres || ''} ${asignacion.docente?.apellidos || ''}`,
        curso: asignacion.curso?.nombre || '',
        nivel: '',
        grado: asignacion.grado?.nombre || '',
        seccion: asignacion.seccion?.nombre || '',
        periodo: asignacion.periodo?.nombre || '',
      },
      estudiantes: estudiantesConAsistencia,
      dias_del_mes: diasDelMes,
    };
  }
}
