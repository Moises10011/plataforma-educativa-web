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
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { NotaService } from './nota.service';
import { CreateNotaDto } from './dto/create-nota.dto';
import { UpdateNotaDto } from './dto/update-nota.dto';
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

@Controller('nota')
export class NotaController {
  constructor(private readonly notaService: NotaService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Docente')
  @Post()
  create(@Body() createNotaDto: CreateNotaDto) {
    return this.notaService.create(createNotaDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('estudiante/mis-notas')
  misNotasEstudiante(@Req() req: AuthRequest) {
    return this.notaService.findAll(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('docente/mis-notas')
  misNotasDocente(@Req() req: AuthRequest) {
    return this.notaService.findAll(req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador', 'Docente')
  @Get('exportar/:id_asignacion')
  async exportar(
    @Param('id_asignacion', ParseIntPipe) id_asignacion: number,
    @Res() res: Response,
  ) {
    const buffer = await this.notaService.exportarExcel(id_asignacion);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=notas_${id_asignacion}.xlsx`,
    });
    res.send(buffer);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador', 'Docente')
  @Get('exportar-curso/:id_curso')
  async exportarPorCurso(
    @Param('id_curso', ParseIntPipe) id_curso: number,
    @Res() res: Response,
  ) {
    const buffer = await this.notaService.exportarExcelPorCurso(id_curso);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=notas_curso_${id_curso}.xlsx`,
    });
    res.send(buffer);
  }

  @UseGuards(JwtAuthGuard)
  @Get('estudiante/:id_usuario_estudiante/curso/:id_curso')
  findPorEstudianteYCurso(
    @Param('id_usuario_estudiante', ParseIntPipe) id_usuario_estudiante: number,
    @Param('id_curso', ParseIntPipe) id_curso: number,
  ) {
    return this.notaService.findPorEstudianteYCurso(
      id_usuario_estudiante,
      id_curso,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.notaService.findAll(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.notaService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Docente')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNotaDto: UpdateNotaDto,
  ) {
    return this.notaService.update(id, updateNotaDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.notaService.remove(id);
  }
}
