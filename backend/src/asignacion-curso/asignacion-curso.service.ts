import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import * as ExcelJS from 'exceljs';

import { AsignacionCurso } from './entities/asignacion-curso.entity';
import { CreateAsignacionCursoDto } from './dto/create-asignacion-curso.dto';
import { UpdateAsignacionCursoDto } from './dto/update-asignacion-curso.dto';
import { Matricula } from '../matricula/entities/matricula.entity';
import { Tarea } from '../tarea/entities/tarea.entity';
import { EntregaTarea } from '../entrega-tarea/entities/entrega-tarea.entity';
import { Asistencia } from '../asistencia/entities/asistencia.entity';
import { Material } from '../material/entities/material.entity';
import { Competencia } from '../competencia/entities/competencia.entity';
import { Nota } from '../nota/entities/nota.entity';
import { PeriodoAcademico } from '../periodo-academico/entities/periodo-academico.entity';

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

  async findEstudiantes(id_asignacion: number) {
    const asignacion = await this.findOne(id_asignacion);

    const matriculas = await this.asignacionRepository.manager
      .getRepository(Matricula)
      .find({
        where: {
          id_grado: asignacion.id_grado,
          id_seccion: asignacion.id_seccion,
          id_periodo: asignacion.id_periodo,
          estado: true,
        },
        relations: { usuario: true },
      });

    return matriculas.map((m) => ({
      id_usuario: m.usuario.id_usuario,
      dni: m.usuario.dni,
      nombres: m.usuario.nombres,
      apellidos: m.usuario.apellidos,
      correo: m.usuario.correo,
      estado: m.usuario.estado,
    }));
  }

  async findTareas(id_asignacion: number) {
    await this.findOne(id_asignacion);

    const tareas = await this.asignacionRepository.manager
      .getRepository(Tarea)
      .find({
        where: { id_asignacion },
        order: { fecha_entrega: 'DESC' },
      });

    const resultado = await Promise.all(
      tareas.map(async (tarea) => {
        const total_entregas = await this.asignacionRepository.manager
          .getRepository(EntregaTarea)
          .count({ where: { id_tarea: tarea.id_tarea } });

        return { ...tarea, total_entregas };
      }),
    );

    return resultado;
  }

  async findEntregasPorTarea(id_tarea: number) {
    const entregas = await this.asignacionRepository.manager
      .getRepository(EntregaTarea)
      .find({
        where: { id_tarea },
        relations: { estudiante: true },
        order: { fecha_entrega: 'DESC' },
      });

    return entregas.map((e) => ({
      id_entrega: e.id_entrega,
      comentario: e.comentario,
      archivos: e.archivos,
      fecha_entrega: e.fecha_entrega,
      estado: e.estado,
      estudiante: {
        id_usuario: e.estudiante.id_usuario,
        nombres: e.estudiante.nombres,
        apellidos: e.estudiante.apellidos,
      },
    }));
  }

  async findAsistencia(id_asignacion: number) {
    await this.findOne(id_asignacion);

    const registros = await this.asignacionRepository.manager
      .getRepository(Asistencia)
      .find({
        where: { id_asignacion },
        relations: { estudiante: true },
        order: { fecha: 'DESC' },
      });

    return registros.map((r) => ({
      id_asistencia: r.id_asistencia,
      fecha: r.fecha,
      estado: r.estado,
      estudiante: {
        id_usuario: r.estudiante.id_usuario,
        nombres: r.estudiante.nombres,
        apellidos: r.estudiante.apellidos,
      },
    }));
  }

  async findResumenAsistencia(id_asignacion: number) {
    await this.findOne(id_asignacion);

    const registros = await this.asignacionRepository.manager
      .getRepository(Asistencia)
      .find({
        where: { id_asignacion },
        relations: { estudiante: true },
      });

    const mapa = new Map<
      number,
      {
        id_usuario: number;
        nombres: string;
        apellidos: string;
        presentes: number;
        ausentes: number;
        tardanzas: number;
      }
    >();

    for (const r of registros) {
      const id = r.estudiante.id_usuario;
      if (!mapa.has(id)) {
        mapa.set(id, {
          id_usuario: id,
          nombres: r.estudiante.nombres,
          apellidos: r.estudiante.apellidos,
          presentes: 0,
          ausentes: 0,
          tardanzas: 0,
        });
      }
      const entry = mapa.get(id)!;
      if (r.estado === 'presente') entry.presentes++;
      else if (r.estado === 'ausente') entry.ausentes++;
      else if (r.estado === 'tardanza') entry.tardanzas++;
    }

    return Array.from(mapa.values());
  }

  async registrarAsistenciaLote(
    id_asignacion: number,
    fecha: string,
    registros: { id_usuario: number; estado: string }[],
  ) {
    await this.findOne(id_asignacion);

    const asistencias = registros.map((r) =>
      this.asignacionRepository.manager.getRepository(Asistencia).create({
        id_asignacion,
        id_usuario_estudiante: r.id_usuario,
        fecha: new Date(fecha),
        estado: r.estado,
      }),
    );

    await this.asignacionRepository.manager
      .getRepository(Asistencia)
      .save(asistencias);

    return {
      message: `Asistencia registrada para ${asistencias.length} estudiantes.`,
    };
  }

  async findMateriales(id_asignacion: number) {
    await this.findOne(id_asignacion);

    const materiales = await this.asignacionRepository.manager
      .getRepository(Material)
      .find({
        where: { id_asignacion },
        order: { fecha_publicacion: 'DESC' },
      });

    return materiales.map((m) => {
      const ext = m.archivo?.split('.').pop() || null;

      return {
        id_material: m.id_material,
        titulo: m.titulo,
        descripcion: m.descripcion,
        url_archivo: m.archivo
          ? `/api/material/${m.id_material}/descargar${ext ? `.${ext}` : ''}`
          : null,
        fecha_publicacion: m.fecha_publicacion,
      };
    });
  }

  async findMisDocentes(authUser: { id_usuario: number }) {
    const matricula = await this.asignacionRepository.manager
      .getRepository(Matricula)
      .findOne({
        where: { id_usuario: authUser.id_usuario, estado: true },
      });

    if (!matricula) return [];

    const asignaciones = await this.asignacionRepository.find({
      where: {
        id_grado: matricula.id_grado,
        id_seccion: matricula.id_seccion,
        id_periodo: matricula.id_periodo,
      },
      relations: { docente: true, curso: true },
    });

    return asignaciones.map((a) => ({
      id_asignacion: a.id_asignacion,
      id_usuario_docente: a.docente.id_usuario,
      nombres: a.docente.nombres,
      apellidos: a.docente.apellidos,
      nombre_completo: `${a.docente.nombres} ${a.docente.apellidos}`,
      correo: a.docente.correo,
      curso: a.curso.nombre,
    }));
  }

  async findMisAsignaciones(authUser: { id_usuario: number }) {
    const asignaciones = await this.asignacionRepository.find({
      where: { id_usuario_docente: authUser.id_usuario },
      relations: { curso: true, grado: true, seccion: true, periodo: true },
    });

    return asignaciones.map((a) => ({
      id_asignacion: a.id_asignacion,
      curso: a.curso.nombre,
      grado: a.grado.nombre,
      seccion: a.seccion.nombre,
      periodo: a.periodo.nombre,
    }));
  }

  async exportarEstudiantesExcel(id_asignacion: number): Promise<Buffer> {
    const asignacion = await this.findOne(id_asignacion);

    const matriculas = await this.asignacionRepository.manager
      .getRepository(Matricula)
      .find({
        where: {
          id_grado: asignacion.id_grado,
          id_seccion: asignacion.id_seccion,
          id_periodo: asignacion.id_periodo,
          estado: true,
        },
        relations: { usuario: true },
      });

    const estudiantes = matriculas
      .map((m) => m.usuario)
      .sort((a, b) =>
        `${a.apellidos} ${a.nombres}`.localeCompare(
          `${b.apellidos} ${b.nombres}`,
        ),
      );

    const encabezados = [
      'N°',
      'DNI',
      'Nombres',
      'Apellidos',
      'Correo',
      'Estado',
    ];
    const totalColumnas = encabezados.length;

    const workbook = new ExcelJS.Workbook();
    const hoja = workbook.addWorksheet('Estudiantes');

    // Título
    hoja.mergeCells(1, 1, 1, totalColumnas);
    const celdaTitulo = hoja.getCell(1, 1);
    celdaTitulo.value = `Lista de Estudiantes - ${asignacion.curso?.nombre ?? ''}`;
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

    hoja.getRow(4).height = 6;

    // Encabezado de tabla (fila 5)
    const filaEncabezado = hoja.getRow(5);
    encabezados.forEach((texto, idx) => {
      const celda = filaEncabezado.getCell(idx + 1);
      celda.value = texto;
      celda.font = { bold: true };
      celda.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Filas de estudiantes
    estudiantes.forEach((est, idx) => {
      const fila = hoja.getRow(6 + idx);
      fila.getCell(1).value = idx + 1;
      fila.getCell(2).value = est.dni ?? '';
      fila.getCell(3).value = est.nombres;
      fila.getCell(4).value = est.apellidos;
      fila.getCell(5).value = est.correo;
      fila.getCell(6).value = est.estado ? 'Activo' : 'Inactivo';

      for (let c = 1; c <= totalColumnas; c++) {
        fila.getCell(c).alignment = {
          horizontal: c <= 2 || c === 6 ? 'center' : 'left',
          vertical: 'middle',
        };
      }
    });

    hoja.getColumn(1).width = 6;
    hoja.getColumn(2).width = 14;
    hoja.getColumn(3).width = 22;
    hoja.getColumn(4).width = 22;
    hoja.getColumn(5).width = 30;
    hoja.getColumn(6).width = 12;

    // Bordes
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

  async findCompetencias(id_asignacion: number) {
    const asignacion = await this.findOne(id_asignacion);

    const competencias = await this.asignacionRepository.manager
      .getRepository(Competencia)
      .find({
        where: { id_curso: asignacion.id_curso },
        order: { id_competencia: 'ASC' },
      });

    return competencias.map((c) => ({
      id_competencia: c.id_competencia,
      nombre: c.nombre,
    }));
  }

  private finDia(fecha: Date): Date {
    const f = new Date(fecha);
    f.setHours(23, 59, 59, 999);
    return f;
  }

  async findNotas(id_asignacion: number, id_periodo: number) {
    const asignacion = await this.findOne(id_asignacion);

    const periodo = await this.asignacionRepository.manager
      .getRepository(PeriodoAcademico)
      .findOne({ where: { id_periodo } });
    if (!periodo)
      throw new NotFoundException(`Periodo #${id_periodo} no encontrado`);

    const competencias = await this.asignacionRepository.manager
      .getRepository(Competencia)
      .find({ where: { id_curso: asignacion.id_curso } });

    const idsCompetencias = competencias.map((c) => c.id_competencia);
    if (idsCompetencias.length === 0) return [];

    const notas = await this.asignacionRepository.manager
      .getRepository(Nota)
      .find({
        where: {
          id_competencia: In(idsCompetencias),
          fecha_registro: Between(
            periodo.fecha_inicio,
            this.finDia(periodo.fecha_fin),
          ),
        },
      });

    return notas.map((n) => ({
      id_nota: n.id_nota,
      id_usuario_estudiante: n.id_usuario_estudiante,
      id_competencia: n.id_competencia,
      valor: n.valor,
    }));
  }

  async registrarNotaLote(
    id_asignacion: number,
    id_periodo: number,
    registros: { id_usuario: number; id_competencia: number; valor: string }[],
    eliminaciones: { id_usuario: number; id_competencia: number }[] = [],
  ) {
    await this.findOne(id_asignacion);

    const periodo = await this.asignacionRepository.manager
      .getRepository(PeriodoAcademico)
      .findOne({ where: { id_periodo } });
    if (!periodo)
      throw new NotFoundException(`Periodo #${id_periodo} no encontrado`);

    const rango = Between(periodo.fecha_inicio, this.finDia(periodo.fecha_fin));
    const notaRepo = this.asignacionRepository.manager.getRepository(Nota);

    for (const r of registros) {
      const existente = await notaRepo.findOne({
        where: {
          id_usuario_estudiante: r.id_usuario,
          id_competencia: r.id_competencia,
          fecha_registro: rango,
        },
      });

      if (existente) {
        existente.valor = r.valor;
        await notaRepo.save(existente);
      } else {
        const nueva = notaRepo.create({
          id_usuario_estudiante: r.id_usuario,
          id_competencia: r.id_competencia,
          valor: r.valor,
        });
        await notaRepo.save(nueva);
      }
    }

    for (const e of eliminaciones) {
      await notaRepo.delete({
        id_usuario_estudiante: e.id_usuario,
        id_competencia: e.id_competencia,
        fecha_registro: rango,
      });
    }

    return {
      message: `Se guardaron ${registros.length} notas y se eliminaron ${eliminaciones.length}.`,
    };
  }

  async exportarNotasExcel(
    id_asignacion: number,
    id_periodo: number,
  ): Promise<Buffer> {
    const asignacion = await this.findOne(id_asignacion);

    const periodo = await this.asignacionRepository.manager
      .getRepository(PeriodoAcademico)
      .findOne({ where: { id_periodo } });
    if (!periodo)
      throw new NotFoundException(`Periodo #${id_periodo} no encontrado`);

    const matriculas = await this.asignacionRepository.manager
      .getRepository(Matricula)
      .find({
        where: {
          id_grado: asignacion.id_grado,
          id_seccion: asignacion.id_seccion,
          id_periodo: asignacion.id_periodo,
          estado: true,
        },
        relations: { usuario: true },
      });

    const estudiantes = matriculas
      .map((m) => m.usuario)
      .sort((a, b) =>
        `${a.apellidos} ${a.nombres}`.localeCompare(
          `${b.apellidos} ${b.nombres}`,
        ),
      );

    const competencias = await this.asignacionRepository.manager
      .getRepository(Competencia)
      .find({
        where: { id_curso: asignacion.id_curso },
        order: { id_competencia: 'ASC' },
      });

    const notas = competencias.length
      ? await this.asignacionRepository.manager.getRepository(Nota).find({
          where: {
            id_competencia: In(competencias.map((c) => c.id_competencia)),
            fecha_registro: Between(
              periodo.fecha_inicio,
              this.finDia(periodo.fecha_fin),
            ),
          },
        })
      : [];

    const mapaNotas = new Map<string, string>();
    for (const n of notas) {
      mapaNotas.set(`${n.id_usuario_estudiante}_${n.id_competencia}`, n.valor);
    }

    const VALOR_A_PUNTOS: Record<string, number> = { AD: 4, A: 3, B: 2, C: 1 };
    const puntosAValor = (p: number): string => {
      if (p >= 3.5) return 'AD';
      if (p >= 2.5) return 'A';
      if (p >= 1.5) return 'B';
      return 'C';
    };

    const encabezados = [
      'N°',
      'Nombres',
      ...competencias.map((c) => c.nombre),
      'Promedio',
    ];
    const totalColumnas = encabezados.length;

    const workbook = new ExcelJS.Workbook();
    const hoja = workbook.addWorksheet('Notas');

    hoja.mergeCells(1, 1, 1, totalColumnas);
    const celdaTitulo = hoja.getCell(1, 1);
    celdaTitulo.value = `Registro de Notas - ${asignacion.curso?.nombre ?? ''}`;
    celdaTitulo.font = { bold: true, size: 14 };
    celdaTitulo.alignment = { horizontal: 'center' };

    hoja.mergeCells(2, 1, 2, totalColumnas);
    const celdaInfo = hoja.getCell(2, 1);
    celdaInfo.value = `Grado: ${asignacion.grado?.nombre ?? ''}    Sección: ${asignacion.seccion?.nombre ?? ''}    ${periodo.nombre}`;
    celdaInfo.font = { bold: true };
    celdaInfo.alignment = { horizontal: 'center' };

    hoja.mergeCells(3, 1, 3, totalColumnas);
    const celdaDocente = hoja.getCell(3, 1);
    const nombreDocente =
      `${asignacion.docente?.nombres ?? ''} ${asignacion.docente?.apellidos ?? ''}`.trim();
    celdaDocente.value = `Docente: ${nombreDocente}`;
    celdaDocente.font = { bold: true };
    celdaDocente.alignment = { horizontal: 'center' };

    hoja.getRow(4).height = 6;

    const filaEncabezado = hoja.getRow(5);
    encabezados.forEach((texto, idx) => {
      const celda = filaEncabezado.getCell(idx + 1);
      celda.value = texto;
      celda.font = { bold: true };
      celda.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    estudiantes.forEach((est, idx) => {
      const fila = hoja.getRow(6 + idx);
      fila.getCell(1).value = idx + 1;
      fila.getCell(2).value = `${est.apellidos} ${est.nombres}`;

      let sumaPuntos = 0;
      let totalConNota = 0;

      competencias.forEach((c, colIdx) => {
        const valor =
          mapaNotas.get(`${est.id_usuario}_${c.id_competencia}`) ?? '';
        fila.getCell(3 + colIdx).value = valor;
        if (valor && VALOR_A_PUNTOS[valor] !== undefined) {
          sumaPuntos += VALOR_A_PUNTOS[valor];
          totalConNota++;
        }
      });

      const celdaPromedio = fila.getCell(3 + competencias.length);
      celdaPromedio.value =
        totalConNota > 0 ? puntosAValor(sumaPuntos / totalConNota) : '';
      celdaPromedio.font = { bold: true };

      for (let c = 1; c <= totalColumnas; c++) {
        fila.getCell(c).alignment = {
          horizontal: c === 2 ? 'left' : 'center',
          vertical: 'middle',
        };
      }
    });

    hoja.getColumn(1).width = 5;
    hoja.getColumn(2).width = 28;
    competencias.forEach((_c, idx) => {
      hoja.getColumn(3 + idx).width = 14;
    });
    hoja.getColumn(3 + competencias.length).width = 12;

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
}
