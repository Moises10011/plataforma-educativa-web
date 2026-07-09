import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { unlink } from 'fs/promises';
import { join } from 'path';

import { Libreta } from './entities/libreta.entity';
import { CreateLibretaDto } from './dto/create-libreta.dto';
import { UpdateLibretaDto } from './dto/update-libreta.dto';
import { Matricula } from '../matricula/entities/matricula.entity';

@Injectable()
export class LibretaService {
  constructor(
    @InjectRepository(Libreta)
    private readonly libretaRepository: Repository<Libreta>,
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
  ) {}

  async create(dto: CreateLibretaDto, archivo?: Express.Multer.File) {
    if (!archivo) {
      throw new BadRequestException('El archivo es obligatorio');
    }
    const libreta = this.libretaRepository.create({
      ...dto,
      archivo: archivo.filename,
    });
    return await this.libretaRepository.save(libreta);
  }

  async findAll(filtros?: {
    id_grado?: number;
    id_seccion?: number;
    id_periodo?: number;
    id_estudiante?: number;
  }) {
    const where: Record<string, unknown> = {};

    if (filtros?.id_periodo) where.id_periodo = filtros.id_periodo;
    if (filtros?.id_estudiante) where.id_estudiante = filtros.id_estudiante;

    if (filtros?.id_grado || filtros?.id_seccion) {
      const whereMatricula: Record<string, unknown> = {};
      if (filtros.id_grado) whereMatricula.id_grado = filtros.id_grado;
      if (filtros.id_seccion) whereMatricula.id_seccion = filtros.id_seccion;
      if (filtros.id_periodo) whereMatricula.id_periodo = filtros.id_periodo;

      const matriculas = await this.matriculaRepository.find({
        where: whereMatricula,
      });
      const idsEstudiantes = matriculas.map((m) => m.id_usuario);
      if (idsEstudiantes.length > 0) {
        where.id_estudiante = In(idsEstudiantes);
      } else {
        return [];
      }
    }

    return this.libretaRepository.find({
      where,
      relations: { estudiante: true, periodo: true },
      order: { fecha_subida: 'DESC' },
    });
  }

  async findEstudiantesConLibreta(
    id_grado: number,
    id_seccion: number,
    id_periodo: number,
  ) {
    const matriculas = await this.matriculaRepository.find({
      where: { id_grado, id_seccion, id_periodo },
      relations: { usuario: true, grado: true, seccion: true },
    });

    const idsEstudiantes = matriculas.map((m) => m.id_usuario);
    const libretas =
      idsEstudiantes.length > 0
        ? await this.libretaRepository.find({
            where: { id_estudiante: In(idsEstudiantes), id_periodo },
          })
        : [];

    const libretaPorEstudiante = new Map(
      libretas.map((l) => [l.id_estudiante, l]),
    );

    return matriculas.map((matricula) => ({
      id_matricula: matricula.id_matricula,
      id_estudiante: matricula.id_usuario,
      nombres: matricula.usuario.nombres,
      apellidos: matricula.usuario.apellidos,
      dni: matricula.usuario.dni,
      grado: matricula.grado.nombre,
      seccion: matricula.seccion.nombre,
      tiene_libreta: libretaPorEstudiante.has(matricula.id_usuario),
      libreta: libretaPorEstudiante.get(matricula.id_usuario) || null,
    }));
  }

  async subirMasiva(
    id_grado: number,
    id_seccion: number,
    id_periodo: number,
    archivos: Express.Multer.File[],
  ) {
    if (!archivos || archivos.length === 0) {
      throw new BadRequestException('Debe subir al menos un archivo');
    }

    const matriculas = await this.matriculaRepository.find({
      where: { id_grado, id_seccion, id_periodo },
      relations: { usuario: true },
    });

    const estudiantePorDni = new Map<string, number>();
    for (const m of matriculas) {
      if (m.usuario.dni) {
        estudiantePorDni.set(m.usuario.dni, m.id_usuario);
      }
    }

    const resultados: Array<{
      archivo: string;
      estado: string;
      dni?: string;
      mensaje?: string;
      estudiante?: string;
    }> = [];
    const libretasACrear: Partial<Libreta>[] = [];

    for (const archivo of archivos) {
      const originalSinExt = archivo.originalname.replace(/\.[^/.]+$/, '');
      const dniMatch = originalSinExt.match(/(\d{8})/);
      const dni = dniMatch ? dniMatch[1] : null;

      if (!dni) {
        resultados.push({
          archivo: archivo.originalname,
          estado: 'error',
          mensaje: 'No se pudo extraer un DNI válido del nombre del archivo',
        });
        const ruta = join(
          process.cwd(),
          'uploads',
          'libretas',
          archivo.filename,
        );
        try {
          await unlink(ruta);
        } catch {
          /* ignore */
        }
        continue;
      }

      const idEstudiante = estudiantePorDni.get(dni);
      if (!idEstudiante) {
        resultados.push({
          archivo: archivo.originalname,
          dni,
          estado: 'error',
          mensaje: `No se encontró estudiante con DNI ${dni} en esta sección`,
        });
        const ruta = join(
          process.cwd(),
          'uploads',
          'libretas',
          archivo.filename,
        );
        try {
          await unlink(ruta);
        } catch {
          /* ignore */
        }
        continue;
      }

      const existente = await this.libretaRepository.findOne({
        where: { id_estudiante: idEstudiante, id_periodo },
      });

      if (existente) {
        const rutaAnterior = join(
          process.cwd(),
          'uploads',
          'libretas',
          existente.archivo,
        );
        try {
          await unlink(rutaAnterior);
        } catch {
          /* ignore */
        }
        existente.archivo = archivo.filename;
        await this.libretaRepository.save(existente);
        const matricula = matriculas.find((m) => m.id_usuario === idEstudiante);
        resultados.push({
          archivo: archivo.originalname,
          dni,
          estado: 'actualizado',
          estudiante: matricula
            ? `${matricula.usuario.nombres} ${matricula.usuario.apellidos}`
            : 'Desconocido',
        });
      } else {
        libretasACrear.push({
          id_estudiante: idEstudiante,
          id_periodo,
          archivo: archivo.filename,
        });
      }
    }

    if (libretasACrear.length > 0) {
      await this.libretaRepository.save(libretasACrear);
    }

    for (const libreta of libretasACrear) {
      const matricula = matriculas.find(
        (m) => m.id_usuario === libreta.id_estudiante,
      );
      resultados.push({
        archivo: libreta.archivo || '',
        dni: matricula?.usuario.dni || undefined,
        estado: 'creado',
        estudiante: matricula
          ? `${matricula.usuario.nombres} ${matricula.usuario.apellidos}`
          : 'Desconocido',
      });
    }

    return {
      total: archivos.length,
      procesados: resultados.filter((r) => r.estado !== 'error').length,
      errores: resultados.filter((r) => r.estado === 'error').length,
      resultados,
    };
  }

  async findOne(id: number) {
    const libreta = await this.libretaRepository.findOne({
      where: { id_libreta: id },
      relations: { estudiante: true, periodo: true },
    });
    if (!libreta) throw new NotFoundException(`Libreta #${id} no encontrada`);
    return libreta;
  }

  async update(
    id: number,
    dto: UpdateLibretaDto,
    archivo?: Express.Multer.File,
  ) {
    const libreta = await this.findOne(id);

    if (archivo && libreta.archivo) {
      const rutaAnterior = join(
        process.cwd(),
        'uploads',
        'libretas',
        libreta.archivo,
      );
      try {
        await unlink(rutaAnterior);
      } catch {
        // si no existe el archivo anterior, continuamos
      }
    }

    Object.assign(libreta, dto);
    if (archivo) {
      libreta.archivo = archivo.filename;
    }

    return await this.libretaRepository.save(libreta);
  }

  async remove(id: number) {
    const libreta = await this.findOne(id);

    const ruta = join(process.cwd(), 'uploads', 'libretas', libreta.archivo);
    try {
      await unlink(ruta);
    } catch {
      // si el archivo ya no existe en disco, no detenemos el proceso
    }

    await this.libretaRepository.remove(libreta);
    return { message: `Libreta #${id} eliminada correctamente` };
  }
}
