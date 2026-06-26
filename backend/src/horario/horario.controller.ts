import { Controller, Get, Param } from '@nestjs/common';
import { HorarioService } from './horario.service';

@Controller('horario')
export class HorarioController {
  constructor(private readonly horarioService: HorarioService) {}

  @Get('grado/:idGrado')
  obtenerHorario(@Param('idGrado') idGrado: number) {
    return this.horarioService.obtenerPorGrado(idGrado);
  }
}