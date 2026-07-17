import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { join } from 'path';

import { Horario } from './entities/horario.entity';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { UpdateHorarioDto } from './dto/update-horario.dto';
import { Matricula } from '../matricula/entities/matricula.entity';

@Injectable()
export class HorarioService {
  constructor(
    @InjectRepository(Horario)
    private readonly horarioRepository: Repository<Horario>,
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
  ) {}

  async create(dto: CreateHorarioDto, archivos?: Express.Multer.File[]) {
    if (!archivos || archivos.length === 0) {
      throw new BadRequestException('Debe subir al menos un archivo');
    }

    const creados: Horario[] = [];
    for (const archivo of archivos) {
      const horario = this.horarioRepository.create({
        tipo: dto.tipo,
        id_grado: dto.tipo === 'estudiante' ? (dto.id_grado ?? null) : null,
        id_seccion: dto.tipo === 'estudiante' ? (dto.id_seccion ?? null) : null,
        id_usuario_docente:
          dto.tipo === 'docente' ? (dto.id_usuario_docente ?? null) : null,
        id_periodo: dto.id_periodo,
        descripcion: dto.descripcion || undefined,
        archivo: archivo.filename,
      });
      creados.push(await this.horarioRepository.save(horario));
    }

    return creados;
  }

  async findAll(filtros?: {
    tipo?: 'estudiante' | 'docente';
    id_grado?: number;
    id_seccion?: number;
    id_periodo?: number;
    id_usuario_docente?: number;
  }) {
    const where: Record<string, unknown> = {};

    if (filtros?.tipo) where.tipo = filtros.tipo;
    if (filtros?.id_grado) where.id_grado = filtros.id_grado;
    if (filtros?.id_seccion) where.id_seccion = filtros.id_seccion;
    if (filtros?.id_periodo) where.id_periodo = filtros.id_periodo;
    if (filtros?.id_usuario_docente)
      where.id_usuario_docente = filtros.id_usuario_docente;

    const horarios = await this.horarioRepository.find({
      where,
      relations: {
        grado: true,
        seccion: true,
        periodo: true,
        docente: true,
      },
      order: { fecha_subida: 'DESC' },
    });

    return horarios;
  }

  async findOne(id: number) {
    const horario = await this.horarioRepository.findOne({
      where: { id_horario: id },
      relations: {
        grado: true,
        seccion: true,
        periodo: true,
        docente: true,
      },
    });
    if (!horario) throw new NotFoundException(`Horario #${id} no encontrado`);
    return horario;
  }

  async update(
    id: number,
    dto: UpdateHorarioDto,
    archivo?: Express.Multer.File,
  ) {
    const horario = await this.findOne(id);

    if (archivo && horario.archivo) {
      const rutaAnterior = join(
        process.cwd(),
        'uploads',
        'horarios',
        horario.archivo,
      );
      try {
        await unlink(rutaAnterior);
      } catch {
        // si no existe el archivo anterior, continuamos
      }
    }

    if (dto.descripcion !== undefined) horario.descripcion = dto.descripcion;
    if (dto.id_grado !== undefined) horario.id_grado = dto.id_grado;
    if (dto.id_seccion !== undefined) horario.id_seccion = dto.id_seccion;
    if (dto.id_periodo !== undefined) horario.id_periodo = dto.id_periodo;
    if (dto.id_usuario_docente !== undefined)
      horario.id_usuario_docente = dto.id_usuario_docente;
    if (archivo) horario.archivo = archivo.filename;

    return await this.horarioRepository.save(horario);
  }

  async remove(id: number) {
    const horario = await this.findOne(id);

    const ruta = join(process.cwd(), 'uploads', 'horarios', horario.archivo);
    try {
      await unlink(ruta);
    } catch {
      // si el archivo ya no existe en disco, no detenemos el proceso
    }

    await this.horarioRepository.remove(horario);
    return { message: `Horario #${id} eliminado correctamente` };
  }
  async misHorariosEstudiante(id_usuario: number) {
    const matriculas = await this.matriculaRepository.find({
      where: { id_usuario, estado: true },
    });

    if (matriculas.length === 0) return [];

    const idsGradoSeccion = matriculas.map((m) => ({
      id_grado: m.id_grado,
      id_seccion: m.id_seccion,
    }));

    const todos = await this.horarioRepository.find({
      where: { tipo: 'estudiante' },
      relations: { grado: true, seccion: true, periodo: true },
      order: { fecha_subida: 'DESC' },
    });

    return todos.filter((h) =>
      idsGradoSeccion.some(
        (m) => m.id_grado === h.id_grado && m.id_seccion === h.id_seccion,
      ),
    );
  }
}
