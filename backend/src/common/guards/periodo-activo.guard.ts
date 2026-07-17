import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Matricula } from '../../matricula/entities/matricula.entity';
import { PeriodoAcademico } from '../../periodo-academico/entities/periodo-academico.entity';

@Injectable()
export class PeriodoActivoGuard implements CanActivate {
  constructor(
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
    @InjectRepository(PeriodoAcademico)
    private readonly periodoRepository: Repository<PeriodoAcademico>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const usuario = request.user;

    if (!usuario) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Administradores siempre tienen acceso
    if (usuario.roles?.includes('Administrador')) {
      return true;
    }

    // Buscar el periodo activo
    const periodoActivo = await this.periodoRepository.findOne({
      where: { estado: true },
    });

    if (!periodoActivo) {
      throw new ForbiddenException('No hay un periodo académico activo. Contacte al administrador.');
    }

    // Verificar si el usuario tiene matrícula en el periodo activo
    const matricula = await this.matriculaRepository.findOne({
      where: {
        id_usuario: usuario.id_usuario,
        id_periodo: periodoActivo.id_periodo,
        estado: true,
      },
    });

    if (!matricula) {
      throw new ForbiddenException(
        `No tienes matrícula activa en el periodo ${periodoActivo.nombre}. Contacta al administrador.`
      );
    }

    // Agregar información del periodo a la request para uso posterior
    request.periodoActivo = periodoActivo;
    request.matriculaActiva = matricula;

    return true;
  }
}