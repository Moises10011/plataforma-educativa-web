import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { AsistenciaService } from './asistencia.service';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { UpdateAsistenciaDto } from './dto/update-asistencia.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

interface AuthRequest extends Request {
  user: {
    id_usuario: number;
    correo: string;
    roles?: string[];
  };
}

@Controller('asistencia')
export class AsistenciaController {
  constructor(private readonly asistenciaService: AsistenciaService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Docente')
  @Post()
  create(@Body() createAsistenciaDto: CreateAsistenciaDto) {
    return this.asistenciaService.create(createAsistenciaDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('estudiante/mi-asistencia')
  miAsistenciaEstudiante(@Req() req: AuthRequest) {
    return this.asistenciaService.findAll(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('docente/mis-registros')
  misRegistrosDocente(@Req() req: AuthRequest) {
    return this.asistenciaService.findAll(req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador', 'Docente')
  @Get('exportar/:id_asignacion')
  async exportar(
    @Param('id_asignacion', ParseIntPipe) id_asignacion: number,
    @Res() res: Response,
  ) {
    const buffer = await this.asistenciaService.exportarExcel(id_asignacion);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=asistencia_${id_asignacion}.xlsx`,
    });
    res.send(buffer);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Docente')
  @Post('importar/:id_asignacion')
  @UseInterceptors(FileInterceptor('archivo'))
  async importar(
    @Param('id_asignacion', ParseIntPipe) id_asignacion: number,
    @UploadedFile() archivo: Express.Multer.File,
  ) {
    return this.asistenciaService.importarExcel(id_asignacion, archivo.buffer);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.asistenciaService.findAll(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.asistenciaService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Docente')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAsistenciaDto: UpdateAsistenciaDto,
  ) {
    return this.asistenciaService.update(id, updateAsistenciaDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.asistenciaService.remove(id);
  }
}
