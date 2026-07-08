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
} from '@nestjs/common';
import { AsignacionCursoService } from './asignacion-curso.service';
import { CreateAsignacionCursoDto } from './dto/create-asignacion-curso.dto';
import { UpdateAsignacionCursoDto } from './dto/update-asignacion-curso.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

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
