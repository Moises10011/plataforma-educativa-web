import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  Res,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { join } from 'path';
import { HorarioService } from './horario.service';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { UpdateHorarioDto } from './dto/update-horario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { crearMulterConfig } from '../common/config/multer.config';
import { UsuarioService } from '../usuario/usuario.service';

@Controller('horario')
export class HorarioController {
  constructor(
    private readonly horarioService: HorarioService,
    private readonly usuarioService: UsuarioService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador', 'Docente')
  @Post()
  @UseInterceptors(
    FilesInterceptor('archivos', 50, crearMulterConfig('horarios')),
  )
  create(
    @Body() dto: CreateHorarioDto,
    @UploadedFiles() archivos?: Express.Multer.File[],
  ) {
    return this.horarioService.create(dto, archivos);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('tipo') tipo?: string,
    @Query('id_grado') id_grado?: string,
    @Query('id_seccion') id_seccion?: string,
    @Query('id_periodo') id_periodo?: string,
    @Query('id_usuario') id_usuario?: string,
  ) {
    return this.horarioService.findAll({
      tipo: tipo as 'estudiante' | 'docente' | undefined,
      id_grado: id_grado ? +id_grado : undefined,
      id_seccion: id_seccion ? +id_seccion : undefined,
      id_periodo: id_periodo ? +id_periodo : undefined,
      id_usuario_docente: id_usuario ? +id_usuario : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('docentes')
  async listarDocentes() {
    const docentes = await this.usuarioService.findByRol('Docente');
    return docentes.map((d) => ({
      id_usuario: d.id_usuario,
      nombres: d.nombres,
      apellidos: d.apellidos,
      nombre_completo: `${d.nombres} ${d.apellidos}`,
    }));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.horarioService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/ver')
  async ver(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const horario = await this.horarioService.findOne(id);
    const ruta = join(process.cwd(), 'uploads', 'horarios', horario.archivo);
    res.sendFile(ruta);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/descargar')
  async descargar(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const horario = await this.horarioService.findOne(id);
    const ruta = join(process.cwd(), 'uploads', 'horarios', horario.archivo);
    res.download(ruta);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador', 'Docente')
  @Put(':id')
  @UseInterceptors(
    FilesInterceptor('archivos', 1, crearMulterConfig('horarios')),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHorarioDto,
    @UploadedFiles() archivos?: Express.Multer.File[],
  ) {
    return this.horarioService.update(id, dto, archivos?.[0]);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.horarioService.remove(id);
  }
}
