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
import { AsignacionCursoService } from './asignacion-curso.service';
import { CreateAsignacionCursoDto } from './dto/create-asignacion-curso.dto';
import { UpdateAsignacionCursoDto } from './dto/update-asignacion-curso.dto';
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

@Controller('asignacion-curso')
export class AsignacionCursoController {
  constructor(
    private readonly asignacionCursoService: AsignacionCursoService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Post()
  create(@Body() createAsignacionCursoDto: CreateAsignacionCursoDto) {
    return this.asignacionCursoService.create(createAsignacionCursoDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.asignacionCursoService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('estudiante/mis-docentes')
  findMisDocentes(@Req() req: AuthRequest) {
    return this.asignacionCursoService.findMisDocentes(req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Docente')
  @Get('docente/mis-asignaciones')
  findMisAsignaciones(@Req() req: AuthRequest) {
    return this.asignacionCursoService.findMisAsignaciones(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.asignacionCursoService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/estudiantes')
  findEstudiantes(@Param('id', ParseIntPipe) id: number) {
    return this.asignacionCursoService.findEstudiantes(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/estudiantes/exportar')
  async exportarEstudiantes(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const buffer =
      await this.asignacionCursoService.exportarEstudiantesExcel(id);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=estudiantes_${id}.xlsx`,
    });
    res.send(buffer);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/tareas')
  findTareas(@Param('id', ParseIntPipe) id: number) {
    return this.asignacionCursoService.findTareas(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/tareas/:id_tarea/entregas')
  findEntregasPorTarea(
    @Param('id', ParseIntPipe) _id: number,
    @Param('id_tarea', ParseIntPipe) id_tarea: number,
  ) {
    return this.asignacionCursoService.findEntregasPorTarea(id_tarea);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/asistencia')
  findAsistencia(@Param('id', ParseIntPipe) id: number) {
    return this.asignacionCursoService.findAsistencia(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/asistencia/resumen')
  findResumenAsistencia(@Param('id', ParseIntPipe) id: number) {
    return this.asignacionCursoService.findResumenAsistencia(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Docente')
  @Post(':id/asistencia/lote')
  registrarAsistenciaLote(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      fecha: string;
      registros: { id_usuario: number; estado: string }[];
    },
  ) {
    return this.asignacionCursoService.registrarAsistenciaLote(
      id,
      body.fecha,
      body.registros,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/materiales')
  findMateriales(@Param('id', ParseIntPipe) id: number) {
    return this.asignacionCursoService.findMateriales(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/competencias')
  findCompetencias(@Param('id', ParseIntPipe) id: number) {
    return this.asignacionCursoService.findCompetencias(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/notas/:id_periodo')
  findNotas(
    @Param('id', ParseIntPipe) id: number,
    @Param('id_periodo', ParseIntPipe) id_periodo: number,
  ) {
    return this.asignacionCursoService.findNotas(id, id_periodo);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Docente')
  @Post(':id/notas/lote')
  registrarNotaLote(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      id_periodo: number;
      registros: {
        id_usuario: number;
        id_competencia: number;
        valor: string;
      }[];
      eliminaciones?: { id_usuario: number; id_competencia: number }[];
    },
  ) {
    return this.asignacionCursoService.registrarNotaLote(
      id,
      body.id_periodo,
      body.registros,
      body.eliminaciones ?? [],
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/notas/exportar/:id_periodo')
  async exportarNotas(
    @Param('id', ParseIntPipe) id: number,
    @Param('id_periodo', ParseIntPipe) id_periodo: number,
    @Res() res: Response,
  ) {
    const buffer = await this.asignacionCursoService.exportarNotasExcel(
      id,
      id_periodo,
    );
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=notas_${id}_${id_periodo}.xlsx`,
    });
    res.send(buffer);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAsignacionCursoDto: UpdateAsignacionCursoDto,
  ) {
    return this.asignacionCursoService.update(id, updateAsignacionCursoDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.asignacionCursoService.remove(id);
  }
}
