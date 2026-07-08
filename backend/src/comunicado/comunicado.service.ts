import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { join } from 'path';

import { Comunicado } from './entities/comunicado.entity';
import {
  Destinatario,
  TipoDestinatario,
} from '../destinatario/entities/destinatario.entity';
import {
  CreateComunicadoDto,
  DestinatarioDto,
} from './dto/create-comunicado.dto';
import { UpdateComunicadoDto } from './dto/update-comunicado.dto';
import { AdjuntoService } from '../adjunto/adjunto.service';

const ENTIDAD = 'comunicado' as const;

interface AuthUser {
  id_usuario: number;
  roles?: string[];
  id_grado?: number;
  id_seccion?: number;
}

export interface FiltrosComunicado {
  tipo?: TipoDestinatario;
  id_grado?: number;
  id_seccion?: number;
  id_usuario?: number;
}

@Injectable()
export class ComunicadoService {
  constructor(
    @InjectRepository(Comunicado)
    private readonly comunicadoRepository: Repository<Comunicado>,
    @InjectRepository(Destinatario)
    private readonly destinatarioRepository: Repository<Destinatario>,
    private readonly adjuntoService: AdjuntoService,
  ) {}

  private validarDestinatarios(destinatarios: DestinatarioDto[]) {
    for (const d of destinatarios) {
      if (d.tipo === 'todos' && (d.id_grado || d.id_seccion || d.id_usuario)) {
        throw new BadRequestException(
          'Un destinatario de tipo "todos" no debe incluir grado, sección ni usuario',
        );
      }
      if (d.tipo === 'docentes' && (d.id_grado || d.id_seccion)) {
        throw new BadRequestException(
          'Un destinatario de tipo "docentes" no debe incluir grado ni sección',
        );
      }
      if (d.tipo === 'estudiantes' && d.id_usuario) {
        throw new BadRequestException(
          'Un destinatario de tipo "estudiantes" no debe incluir un usuario puntual',
        );
      }
    }
  }

  async create(
    createComunicadoDto: CreateComunicadoDto,
    authUser: AuthUser,
    archivos: Express.Multer.File[] = [],
  ) {
    this.validarDestinatarios(createComunicadoDto.destinatarios);

    const comunicado = this.comunicadoRepository.create({
      titulo: createComunicadoDto.titulo,
      contenido: createComunicadoDto.contenido,
      id_usuario_admin: authUser.id_usuario,
    });
    const guardado = await this.comunicadoRepository.save(comunicado);

    const destinatarios = createComunicadoDto.destinatarios.map((d) =>
      this.destinatarioRepository.create({
        entidad: ENTIDAD,
        entidad_id: guardado.id_comunicado,
        tipo: d.tipo,
        id_grado: d.id_grado ?? null,
        id_seccion: d.id_seccion ?? null,
        id_usuario: d.id_usuario ?? null,
      }),
    );
    await this.destinatarioRepository.save(destinatarios);

    if (archivos.length > 0) {
      await this.adjuntoService.guardarAdjuntos(
        ENTIDAD,
        guardado.id_comunicado,
        'comunicados',
        archivos,
      );
    }

    return this.findOne(guardado.id_comunicado);
  }

  private async destinatariosPorEntidadId(
    ids: number[],
  ): Promise<Destinatario[]> {
    if (!ids.length) return [];
    return this.destinatarioRepository
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.grado', 'grado')
      .leftJoinAndSelect('d.seccion', 'seccion')
      .leftJoinAndSelect('d.usuario', 'usuario')
      .where('d.entidad = :entidad', { entidad: ENTIDAD })
      .andWhere('d.entidad_id IN (:...ids)', { ids })
      .getMany();
  }

  private combinarComunicadosConDestinatarios(
    comunicados: Comunicado[],
    destinatarios: Destinatario[],
  ) {
    return comunicados.map((c) => ({
      ...c,
      destinatarios: destinatarios.filter(
        (d) => d.entidad_id === c.id_comunicado,
      ),
    }));
  }

  async findAll(filtros: FiltrosComunicado = {}) {
    const comunicados = await this.comunicadoRepository.find({
      relations: { admin: true },
      order: { fecha_publicacion: 'DESC' },
    });

    const ids = comunicados.map((c) => c.id_comunicado);
    let destinatarios = await this.destinatariosPorEntidadId(ids);

    if (filtros.tipo) {
      destinatarios = destinatarios.filter((d) => d.tipo === filtros.tipo);
    }
    if (filtros.id_grado) {
      destinatarios = destinatarios.filter(
        (d) => d.id_grado === filtros.id_grado,
      );
    }
    if (filtros.id_seccion) {
      destinatarios = destinatarios.filter(
        (d) => d.id_seccion === filtros.id_seccion,
      );
    }
    if (filtros.id_usuario) {
      destinatarios = destinatarios.filter(
        (d) => d.id_usuario === filtros.id_usuario,
      );
    }

    const idsConDestinatarioValido = new Set(
      destinatarios.map((d) => d.entidad_id),
    );
    const huboFiltro =
      filtros.tipo ||
      filtros.id_grado ||
      filtros.id_seccion ||
      filtros.id_usuario;

    const comunicadosFiltrados = huboFiltro
      ? comunicados.filter((c) => idsConDestinatarioValido.has(c.id_comunicado))
      : comunicados;

    const idsFinales = comunicadosFiltrados.map((c) => c.id_comunicado);
    const destinatariosCompletos =
      await this.destinatariosPorEntidadId(idsFinales);

    return this.combinarComunicadosConDestinatarios(
      comunicadosFiltrados,
      destinatariosCompletos,
    );
  }

  async findAllParaUsuario(
    authUser: AuthUser,
    filtros: FiltrosComunicado = {},
  ) {
    const esAdmin = authUser.roles?.includes('Administrador');
    if (esAdmin) {
      return this.findAll(filtros);
    }

    const comunicados = await this.comunicadoRepository.find({
      relations: { admin: true },
      order: { fecha_publicacion: 'DESC' },
    });
    const ids = comunicados.map((c) => c.id_comunicado);
    const destinatarios = await this.destinatariosPorEntidadId(ids);

    const esDocente = authUser.roles?.includes('Docente');
    const destinatariosVisibles = destinatarios.filter((d) => {
      if (d.tipo === 'todos') return true;
      if (esDocente) {
        return (
          d.tipo === 'docentes' &&
          (!d.id_usuario || d.id_usuario === authUser.id_usuario)
        );
      }
      return (
        d.tipo === 'estudiantes' &&
        (!d.id_grado || d.id_grado === authUser.id_grado) &&
        (!d.id_seccion || d.id_seccion === authUser.id_seccion)
      );
    });

    const idsVisibles = new Set(destinatariosVisibles.map((d) => d.entidad_id));
    const comunicadosVisibles = comunicados.filter((c) =>
      idsVisibles.has(c.id_comunicado),
    );

    const idsFinales = comunicadosVisibles.map((c) => c.id_comunicado);
    const destinatariosCompletos =
      await this.destinatariosPorEntidadId(idsFinales);

    return this.combinarComunicadosConDestinatarios(
      comunicadosVisibles,
      destinatariosCompletos,
    );
  }

  async findOne(id: number) {
    const comunicado = await this.comunicadoRepository.findOne({
      where: { id_comunicado: id },
      relations: { admin: true },
    });
    if (!comunicado)
      throw new NotFoundException(`Comunicado #${id} no encontrado`);

    const destinatarios = await this.destinatariosPorEntidadId([id]);
    const adjuntos = await this.adjuntoService.obtenerAdjuntosDe(ENTIDAD, id);
    return { ...comunicado, destinatarios, adjuntos };
  }

  async update(
    id: number,
    updateComunicadoDto: UpdateComunicadoDto,
    authUser: AuthUser,
    archivos: Express.Multer.File[] = [],
  ) {
    const comunicadoBase = await this.comunicadoRepository.findOne({
      where: { id_comunicado: id },
    });
    if (!comunicadoBase)
      throw new NotFoundException(`Comunicado #${id} no encontrado`);

    const esAdmin = authUser.roles?.includes('Administrador');
    const esPropietario =
      comunicadoBase.id_usuario_admin === authUser.id_usuario;

    if (!esAdmin && !esPropietario) {
      throw new ForbiddenException(
        'No puedes modificar un comunicado de otra persona',
      );
    }

    if (updateComunicadoDto.titulo !== undefined) {
      comunicadoBase.titulo = updateComunicadoDto.titulo;
    }
    if (updateComunicadoDto.contenido !== undefined) {
      comunicadoBase.contenido = updateComunicadoDto.contenido;
    }

    await this.comunicadoRepository.save(comunicadoBase);

    if (archivos.length > 0) {
      await this.adjuntoService.guardarAdjuntos(
        ENTIDAD,
        id,
        'comunicados',
        archivos,
      );
    }

    if (updateComunicadoDto.destinatarios) {
      this.validarDestinatarios(updateComunicadoDto.destinatarios);
      await this.destinatarioRepository.delete({
        entidad: ENTIDAD,
        entidad_id: id,
      });
      const nuevos = updateComunicadoDto.destinatarios.map((d) =>
        this.destinatarioRepository.create({
          entidad: ENTIDAD,
          entidad_id: id,
          tipo: d.tipo,
          id_grado: d.id_grado ?? null,
          id_seccion: d.id_seccion ?? null,
          id_usuario: d.id_usuario ?? null,
        }),
      );
      await this.destinatarioRepository.save(nuevos);
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    const comunicado = await this.comunicadoRepository.findOne({
      where: { id_comunicado: id },
    });
    if (!comunicado)
      throw new NotFoundException(`Comunicado #${id} no encontrado`);

    if (comunicado.archivo) {
      const ruta = join(
        process.cwd(),
        'uploads',
        'comunicados',
        comunicado.archivo,
      );
      try {
        await unlink(ruta);
      } catch {
        // archivo legado ya no existe en disco, se ignora
      }
    }

    await this.adjuntoService.eliminarTodosDe(ENTIDAD, id);
    await this.destinatarioRepository.delete({
      entidad: ENTIDAD,
      entidad_id: id,
    });
    await this.comunicadoRepository.remove(comunicado);
    return { message: `Comunicado #${id} eliminado correctamente` };
  }
}
