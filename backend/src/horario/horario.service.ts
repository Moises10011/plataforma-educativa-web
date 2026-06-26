import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HorariosEntity } from './entities/horario.entity';

@Injectable()
export class HorarioService {
  constructor(
    @InjectRepository(HorariosEntity)
    private readonly horarioRepository: Repository<HorariosEntity>,
  ) {}

  obtenerPorGrado(idGrado: number) {
    return this.horarioRepository.find({
      where: { asignacion: { id_grado: idGrado } as any },
      relations: {
        asignacion: {
          curso: true
        }
      },
      order: { hora_inicio: 'ASC' }
    });
  }
}