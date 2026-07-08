import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
  UseGuards,
  Delete,
} from '@nestjs/common';
import type { Response } from 'express';
import { AdjuntoService } from './adjunto.service';
import { Adjunto } from './entities/adjunto.entity';
import type { EntidadAdjunto } from './entities/adjunto.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const TIPOS_VISIBLES_EN_NAVEGADOR = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
];

@Controller('adjunto')
@UseGuards(JwtAuthGuard)
export class AdjuntoController {
  constructor(private readonly adjuntoService: AdjuntoService) {}

  @Get(':id/descargar')
  async descargar(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ): Promise<void> {
    const { ruta, adjunto } = await this.adjuntoService.obtenerRutaFisica(id);

    const disposicion = TIPOS_VISIBLES_EN_NAVEGADOR.includes(adjunto.mime_type)
      ? 'inline'
      : 'attachment';

    res.setHeader('Content-Type', adjunto.mime_type);
    res.setHeader(
      'Content-Disposition',
      `${disposicion}; filename="${encodeURIComponent(adjunto.nombre_original)}"`,
    );

    res.sendFile(ruta, (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ message: 'Archivo no encontrado en disco' });
      }
    });
  }

  @Get()
  async listar(
    @Query('entidad') entidad: EntidadAdjunto,
    @Query('entidad_id', ParseIntPipe) entidad_id: number,
  ): Promise<Adjunto[]> {
    return this.adjuntoService.obtenerAdjuntosDe(entidad, entidad_id);
  }

  @Delete(':id')
  async eliminar(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ mensaje: string }> {
    await this.adjuntoService.eliminarAdjunto(id);
    return { mensaje: 'Adjunto eliminado correctamente' };
  }
}
