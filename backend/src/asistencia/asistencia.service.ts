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
import { leerExcel } from '../common/utils/excel.util';
import { Matricula } from '../matricula/entities/matricula.entity';
import { AsignacionCurso } from '../asignacion-curso/entities/asignacion-curso.entity';
import { Usuario } from '../usuario/entities/usuario.entity';
import * as ExcelJS from 'exceljs';

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

  async exportarExcel(id_asignacion: number): Promise<Buffer> {
    const asignacionRepo =
      this.asistenciaRepository.manager.getRepository(AsignacionCurso);
    const matriculaRepo =
      this.asistenciaRepository.manager.getRepository(Matricula);
    const usuarioRepo =
      this.asistenciaRepository.manager.getRepository(Usuario);

    const asignacion = await asignacionRepo.findOne({
      where: { id_asignacion },
      relations: {
        docente: true,
        curso: true,
        grado: true,
        seccion: true,
        periodo: true,
      },
    });

    if (!asignacion) {
      throw new NotFoundException(`Asignación #${id_asignacion} no encontrada`);
    }

    // Estudiantes matriculados
    const matriculas = await matriculaRepo.find({
      where: {
        id_grado: asignacion.id_grado,
        id_seccion: asignacion.id_seccion,
        id_periodo: asignacion.id_periodo,
        estado: true,
      },
      relations: { usuario: true },
    });

    const idsEstudiantes = matriculas.map((m) => m.id_usuario);
    const estudiantes = idsEstudiantes.length
      ? await usuarioRepo.find({ where: { id_usuario: In(idsEstudiantes) } })
      : [];

    estudiantes.sort((a, b) =>
      `${a.apellidos} ${a.nombres}`.localeCompare(
        `${b.apellidos} ${b.nombres}`,
      ),
    );

    // Registros de asistencia de esta asignación
    const registros = await this.asistenciaRepository.find({
      where: { id_asignacion },
      relations: { estudiante: true },
    });

    // Convierte fecha (Date o string) a 'yyyy-mm-dd' de forma segura
    const aIso = (fecha: unknown): string => {
      if (fecha instanceof Date) {
        return fecha.toISOString().slice(0, 10);
      }
      return String(fecha).slice(0, 10);
    };

    // Fechas únicas, ordenadas
    const fechasSet = new Set<string>();
    const mapaEstados = new Map<string, string>();

    for (const r of registros) {
      const iso = aIso(r.fecha);
      fechasSet.add(iso);
      mapaEstados.set(`${r.id_usuario_estudiante}_${iso}`, r.estado);
    }

    const fechasOrdenadas = Array.from(fechasSet).sort();

    const etiquetaFecha = (iso: string): string => {
      const [anio, mes, dia] = iso.split('-');
      return `${dia}/${mes}/${anio}`;
    };

    const etiquetaEstado = (estado?: string): string => {
      switch (estado) {
        case 'presente':
          return 'P';
        case 'falta':
          return 'F';
        case 'tardanza':
          return 'T';
        case 'justificado':
          return 'J';
        default:
          return '';
      }
    };

    // ── Construcción del Excel ──────────────────────────────────────────────
    const workbook = new ExcelJS.Workbook();
    const hoja = workbook.addWorksheet('Asistencia');

    const totalColumnas = 2 + fechasOrdenadas.length; // # + Nombres + fechas

    // Título
    hoja.mergeCells(1, 1, 1, totalColumnas);
    const celdaTitulo = hoja.getCell(1, 1);
    celdaTitulo.value = `Registro de Asistencia - ${asignacion.curso?.nombre ?? ''}`;
    celdaTitulo.font = { bold: true, size: 14 };
    celdaTitulo.alignment = { horizontal: 'center' };

    // Grado y Sección
    hoja.mergeCells(2, 1, 2, totalColumnas);
    const celdaGradoSeccion = hoja.getCell(2, 1);
    celdaGradoSeccion.value = `Grado: ${asignacion.grado?.nombre ?? ''}    Sección: ${asignacion.seccion?.nombre ?? ''}`;
    celdaGradoSeccion.font = { bold: true };
    celdaGradoSeccion.alignment = { horizontal: 'center' };

    // Docente
    hoja.mergeCells(3, 1, 3, totalColumnas);
    const celdaDocente = hoja.getCell(3, 1);
    const nombreDocente =
      `${asignacion.docente?.nombres ?? ''} ${asignacion.docente?.apellidos ?? ''}`.trim();
    celdaDocente.value = `Docente: ${nombreDocente}`;
    celdaDocente.font = { bold: true };
    celdaDocente.alignment = { horizontal: 'center' };

    // Fila 4 vacía como separador
    hoja.getRow(4).height = 6;

    // Encabezado de la tabla (fila 5)
    const filaEncabezado = hoja.getRow(5);
    filaEncabezado.getCell(1).value = '#';
    filaEncabezado.getCell(2).value = 'Nombres';
    fechasOrdenadas.forEach((iso, idx) => {
      filaEncabezado.getCell(3 + idx).value = etiquetaFecha(iso);
    });
    for (let c = 1; c <= totalColumnas; c++) {
      const celda = filaEncabezado.getCell(c);
      celda.font = { bold: true };
      celda.alignment = { horizontal: 'center', vertical: 'middle' };
    }

    // Filas de estudiantes (desde la fila 6)
    estudiantes.forEach((est, idx) => {
      const fila = hoja.getRow(6 + idx);
      fila.getCell(1).value = idx + 1;
      fila.getCell(1).alignment = { horizontal: 'center' };
      fila.getCell(2).value = `${est.apellidos} ${est.nombres}`;

      fechasOrdenadas.forEach((iso, colIdx) => {
        const estado = mapaEstados.get(`${est.id_usuario}_${iso}`);
        const celda = fila.getCell(3 + colIdx);
        celda.value = etiquetaEstado(estado);
        celda.alignment = { horizontal: 'center', vertical: 'middle' };
      });
    });

    // Anchos de columna
    hoja.getColumn(1).width = 5;
    hoja.getColumn(2).width = 30;
    fechasOrdenadas.forEach((_iso, idx) => {
      hoja.getColumn(3 + idx).width = 10;
    });

    // Bordes de toda la tabla
    const filaFinal = 5 + estudiantes.length;
    for (let f = 5; f <= filaFinal; f++) {
      for (let c = 1; c <= totalColumnas; c++) {
        hoja.getCell(f, c).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
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
  async eliminarPorFecha(
    id_asignacion: number,
    fecha: string,
  ): Promise<{ message: string }> {
    // fecha llega como 'yyyy-mm-dd'
    const inicio = new Date(`${fecha}T00:00:00.000Z`);
    const fin = new Date(`${fecha}T23:59:59.999Z`);

    const result = await this.asistenciaRepository.delete({
      id_asignacion,
      fecha: Between(inicio, fin),
    });

    return {
      message: `Se eliminaron ${result.affected ?? 0} registros de asistencia del ${fecha}`,
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
