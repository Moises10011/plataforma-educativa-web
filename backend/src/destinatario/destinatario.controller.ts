import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { DestinatarioService } from './destinatario.service';
import { CreateDestinatarioDto } from './dto/create-destinatario.dto';
import { UpdateDestinatarioDto } from './dto/update-destinatario.dto';
import type { EntidadDestinatario } from './entities/destinatario.entity';

function esEntidadValida(valor: string): valor is EntidadDestinatario {
  return valor === 'comunicado' || valor === 'documento_institucional';
}

@Controller('destinatario')
export class DestinatarioController {
  constructor(private readonly destinatarioService: DestinatarioService) {}

  @Post()
  create(@Body() dto: CreateDestinatarioDto) {
    return this.destinatarioService.create(dto);
  }

  @Get()
  findAll() {
    return this.destinatarioService.findAll();
  }

  @Get('by-entidad/:entidad/:entidadId')
  findByEntidad(
    @Param('entidad') entidad: string,
    @Param('entidadId', ParseIntPipe) entidadId: number,
  ) {
    if (!esEntidadValida(entidad)) {
      throw new BadRequestException(
        `entidad debe ser "comunicado" o "documento_institucional", recibido: ${entidad}`,
      );
    }
    return this.destinatarioService.findByEntidad(entidad, entidadId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.destinatarioService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDestinatarioDto,
  ) {
    return this.destinatarioService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.destinatarioService.remove(id);
  }
}
