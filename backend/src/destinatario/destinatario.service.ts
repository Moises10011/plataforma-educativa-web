import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Destinatario } from './entities/destinatario.entity';
import type {
  EntidadDestinatario,
  TipoDestinatario,
} from './entities/destinatario.entity';
import { CreateDestinatarioDto } from './dto/create-destinatario.dto';
import { UpdateDestinatarioDto } from './dto/update-destinatario.dto';
import { Comunicado } from '../comunicado/entities/comunicado.entity';
import { DocumentoInstitucional } from '../documento-institucional/entities/documento-institucional.entity';
import { Matricula } from '../matricula/entities/matricula.entity';

@Injectable()
export class DestinatarioService {
  constructor(
    @InjectRepository(Destinatario)
    private readonly destinatarioRepository: Repository<Destinatario>,
    @InjectRepository(Comunicado)
    private readonly comunicadoRepository: Repository<Comunicado>,
    @InjectRepository(DocumentoInstitucional)
    private readonly documentoRepository: Repository<DocumentoInstitucional>,
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
  ) {}

  private validarConsistenciaTipo(datos: {
    tipo?: TipoDestinatario;
    id_grado?: number | null;
    id_seccion?: number | null;
    id_usuario?: number | null;
  }) {
    const { tipo, id_grado, id_seccion, id_usuario } = datos;

    if (tipo === 'todos' && (id_grado || id_seccion || id_usuario)) {
      throw new BadRequestException(
        'Cuando tipo es "todos", no debe incluir id_grado, id_seccion ni id_usuario.',
      );
    }

    if (tipo === 'estudiantes') {
      if (!id_grado) {
        throw new BadRequestException(
          'Cuando tipo es "estudiantes", id_grado es obligatorio.',
        );
      }
      if (id_usuario) {
        throw new BadRequestException(
          'Cuando tipo es "estudiantes", no debe incluir id_usuario.',
        );
      }
    }

    if (tipo === 'docentes' && (id_grado || id_seccion)) {
      throw new BadRequestException(
        'Cuando tipo es "docentes", no debe incluir id_grado ni id_seccion.',
      );
    }
  }

  private async validarEntidadExiste(
    entidad: EntidadDestinatario,
    entidad_id: number,
  ) {
    if (entidad === 'comunicado') {
      const comunicado = await this.comunicadoRepository.findOneBy({
        id_comunicado: entidad_id,
      });
      if (!comunicado) {
        throw new BadRequestException(
          `No existe un comunicado con id ${entidad_id}.`,
        );
      }
    } else if (entidad === 'documento_institucional') {
      const documento = await this.documentoRepository.findOneBy({
        id_documento: entidad_id,
      });
      if (!documento) {
        throw new BadRequestException(
          `No existe un documento institucional con id ${entidad_id}.`,
        );
      }
    }
  }

  async obtenerEntidadIdsParaUsuario(
    entidad: EntidadDestinatario,
    authUser: { id_usuario: number; roles?: string[] },
  ): Promise<number[]> {
    const esDocente = authUser.roles?.some(
      (r) => r.toLowerCase() === 'docente',
    );
    const esEstudiante = authUser.roles?.some(
      (r) => r.toLowerCase() === 'estudiante',
    );

    const qb = this.destinatarioRepository
      .createQueryBuilder('d')
      .where('d.entidad = :entidad', { entidad })
      .andWhere(
        new Brackets((qb2) => {
          qb2.where('d.tipo = :todos', { todos: 'todos' });
          if (esDocente) {
            qb2.orWhere(
              '(d.tipo = :docentes AND (d.id_usuario = :id_usuario OR d.id_usuario IS NULL))',
              { docentes: 'docentes', id_usuario: authUser.id_usuario },
            );
          }
        }),
      );

    if (esEstudiante) {
      const matricula = await this.matriculaRepository.findOne({
        where: { id_usuario: authUser.id_usuario, estado: true },
        order: { fecha_matricula: 'DESC' },
      });

      if (matricula) {
        qb.orWhere(
          new Brackets((qb2) => {
            qb2
              .where('d.entidad = :entidad', { entidad })
              .andWhere('d.tipo = :estudiantes', { estudiantes: 'estudiantes' })
              .andWhere('d.id_grado = :id_grado', {
                id_grado: matricula.id_grado,
              })
              .andWhere(
                '(d.id_seccion IS NULL OR d.id_seccion = :id_seccion)',
                { id_seccion: matricula.id_seccion },
              );
          }),
        );
      }
    }

    const destinatarios = await qb.getMany();
    return destinatarios.map((d) => d.entidad_id);
  }

  async create(dto: CreateDestinatarioDto): Promise<Destinatario> {
    this.validarConsistenciaTipo(dto);
    await this.validarEntidadExiste(dto.entidad, dto.entidad_id);

    const destinatario = this.destinatarioRepository.create(dto);
    return this.destinatarioRepository.save(destinatario);
  }

  async findAll(): Promise<Destinatario[]> {
    return this.destinatarioRepository.find({
      relations: { grado: true, seccion: true, usuario: true },
    });
  }

  async findOne(id: number): Promise<Destinatario> {
    const destinatario = await this.destinatarioRepository.findOne({
      where: { id },
      relations: { grado: true, seccion: true, usuario: true },
    });
    if (!destinatario) {
      throw new NotFoundException(`Destinatario con id ${id} no encontrado.`);
    }
    return destinatario;
  }

  async findByEntidad(
    entidad: EntidadDestinatario,
    entidad_id: number,
  ): Promise<Destinatario[]> {
    return this.destinatarioRepository.find({
      where: { entidad, entidad_id },
      relations: { grado: true, seccion: true, usuario: true },
    });
  }

  async update(id: number, dto: UpdateDestinatarioDto): Promise<Destinatario> {
    const destinatario = await this.findOne(id);

    const merged = { ...destinatario, ...dto };
    this.validarConsistenciaTipo(merged);

    Object.assign(destinatario, dto);
    return this.destinatarioRepository.save(destinatario);
  }

  async remove(id: number): Promise<void> {
    const destinatario = await this.findOne(id);
    await this.destinatarioRepository.remove(destinatario);
  }

  async getEntidadReferida(
    destinatario: Destinatario,
  ): Promise<Comunicado | DocumentoInstitucional | null> {
    if (destinatario.entidad === 'comunicado') {
      return this.comunicadoRepository.findOneBy({
        id_comunicado: destinatario.entidad_id,
      });
    }
    return this.documentoRepository.findOneBy({
      id_documento: destinatario.entidad_id,
    });
  }
}
