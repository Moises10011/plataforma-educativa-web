import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PeriodoAcademico } from './entities/periodo-academico.entity';
import { CreatePeriodoAcademicoDto } from './dto/create-periodo-academico.dto';
import { UpdatePeriodoAcademicoDto } from './dto/update-periodo-academico.dto';

@Injectable()
export class PeriodoAcademicoService {
  constructor(
    @InjectRepository(PeriodoAcademico)
    private readonly periodoRepository: Repository<PeriodoAcademico>,
  ) {}

  async create(createPeriodoAcademicoDto: CreatePeriodoAcademicoDto) {
    await this.validarPeriodo(createPeriodoAcademicoDto);
    const periodo = this.periodoRepository.create(createPeriodoAcademicoDto);
    return await this.periodoRepository.save(periodo);
  }

  findAll() {
    return this.periodoRepository.find({
      order: { anio: 'DESC', fecha_inicio: 'DESC' },
    });
  }

  async findOne(id: number) {
    const periodo = await this.periodoRepository.findOneBy({ id_periodo: id });
    if (!periodo) throw new NotFoundException(`Periodo #${id} no encontrado`);
    return periodo;
  }

  async findActivo() {
    const periodo = await this.periodoRepository.findOne({
      where: { estado: true },
      order: { fecha_inicio: 'DESC' },
    });
    return periodo;
  }

  async update(
    id: number,
    updatePeriodoAcademicoDto: UpdatePeriodoAcademicoDto,
  ) {
    const periodo = await this.findOne(id);

    if (
      updatePeriodoAcademicoDto.fecha_inicio ||
      updatePeriodoAcademicoDto.fecha_fin
    ) {
      const fechaInicio =
        updatePeriodoAcademicoDto.fecha_inicio ?? periodo.fecha_inicio;
      const fechaFin = updatePeriodoAcademicoDto.fecha_fin ?? periodo.fecha_fin;
      const datosValidacion = {
        nombre: updatePeriodoAcademicoDto.nombre ?? periodo.nombre,
        anio: updatePeriodoAcademicoDto.anio ?? periodo.anio,
        fecha_inicio:
          fechaInicio instanceof Date
            ? fechaInicio.toISOString().split('T')[0]
            : fechaInicio,
        fecha_fin:
          fechaFin instanceof Date
            ? fechaFin.toISOString().split('T')[0]
            : fechaFin,
        estado: updatePeriodoAcademicoDto.estado ?? periodo.estado,
      };
      await this.validarPeriodo(datosValidacion, id);
    }

    Object.assign(periodo, updatePeriodoAcademicoDto);
    return await this.periodoRepository.save(periodo);
  }

  async cerrarPeriodo(id: number) {
    const periodo = await this.findOne(id);
    if (!periodo.estado) {
      throw new BadRequestException('El periodo ya está cerrado');
    }
    periodo.estado = false;
    return await this.periodoRepository.save(periodo);
  }

  async remove(id: number) {
    const periodo = await this.findOne(id);
    const tieneMatriculas = await this.periodoRepository
      .createQueryBuilder('p')
      .leftJoin('matricula', 'm', 'm.id_periodo = p.id_periodo')
      .where('p.id_periodo = :id', { id })
      .andWhere('m.id_matricula IS NOT NULL')
      .getCount();

    if (tieneMatriculas > 0) {
      throw new BadRequestException(
        'No se puede eliminar el periodo porque tiene matrículas asociadas. Cierre el periodo en su lugar.',
      );
    }

    await this.periodoRepository.remove(periodo);
    return { message: `Periodo #${id} eliminado correctamente` };
  }

  private async validarPeriodo(
    datos: CreatePeriodoAcademicoDto,
    idExcluir?: number,
  ) {
    const fechaInicio = new Date(datos.fecha_inicio);
    const fechaFin = new Date(datos.fecha_fin);

    if (fechaInicio >= fechaFin) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior a la fecha de fin',
      );
    }

    const query = this.periodoRepository
      .createQueryBuilder('p')
      .where('p.fecha_inicio <= :fin', { fin: fechaFin })
      .andWhere('p.fecha_fin >= :inicio', { inicio: fechaInicio });

    if (idExcluir) {
      query.andWhere('p.id_periodo != :id', { id: idExcluir });
    }

    const periodosSolapados = await query.getCount();

    if (periodosSolapados > 0) {
      throw new ConflictException(
        'Las fechas del periodo se solapan con otro periodo existente',
      );
    }

    if (datos.estado) {
      const periodoActivo = await this.periodoRepository.findOne({
        where: { estado: true },
      });

      if (periodoActivo && periodoActivo.id_periodo !== idExcluir) {
        throw new ConflictException(
          'Ya existe un periodo activo. Cierre el periodo actual antes de activar otro.',
        );
      }
    }
  }
}
