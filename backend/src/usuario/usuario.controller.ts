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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { CrearConRolDto } from './dto/crear-con-rol.dto';
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

@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @UseGuards(JwtAuthGuard)
  @Get('perfil/mi-perfil')
  getMyProfile(@Req() req: AuthRequest) {
    return this.usuarioService.findMyProfile(req.user);
  }

  @Get('estadisticas/conteo')
  contarPorRol() {
    return this.usuarioService.contarPorRol();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Estudiante')
  @Get('estudiante/dashboard')
  getEstudianteDashboard(@Req() req: AuthRequest) {
    return this.usuarioService.getEstudianteDashboard(req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Estudiante')
  @Get('estudiante/dashboard-resumen')
  getResumenDashboard(@Req() req: AuthRequest) {
    return this.usuarioService.getResumenDashboardEstudiante(req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Estudiante')
  @Get('estudiante/cursos')
  getCursosEstudiante(@Req() req: AuthRequest) {
    return this.usuarioService.findCursosEstudiante(req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Docente')
  @Get('docente/dashboard')
  getDocenteDashboard(@Req() req: AuthRequest) {
    return this.usuarioService.getDocenteDashboard(req.user);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Docente')
  @Get('docente/asignaciones/:id')
  getAsignacionDetalle(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthRequest,
  ) {
    return this.usuarioService.getAsignacionDetalle(id, req.user);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Estudiante')
  @Get('estudiante/asignaciones/:id')
  getAsignacionDetalleEstudiante(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthRequest,
  ) {
    return this.usuarioService.getAsignacionDetalleEstudiante(id, req.user);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Estudiante')
  @Get('estudiante/curso/:id_curso')
  getCursoDetalleEstudiante(
    @Param('id_curso', ParseIntPipe) id_curso: number,
    @Req() req: AuthRequest,
  ) {
    return this.usuarioService.getCursoDetalleEstudiante(id_curso, req.user);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Get('admin/dashboard')
  getAdminDashboard(@Req() req: AuthRequest) {
    return this.usuarioService.getAdminDashboard(req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Get('estudiantes')
  findEstudiantes() {
    return this.usuarioService.findByRol('Estudiante');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Get('docentes')
  findDocentes() {
    return this.usuarioService.findByRol('Docente');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Post('crear-con-rol')
  @HttpCode(HttpStatus.CREATED)
  crearConRol(@Body() dto: CrearConRolDto) {
    return this.usuarioService.crearConRol(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Post('crear-masivo')
  @HttpCode(HttpStatus.CREATED)
  crearMasivo(@Body() body: { usuarios: CrearConRolDto[] }) {
    return this.usuarioService.crearMasivo(body.usuarios);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuarioService.create(createUsuarioDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador', 'Docente')
  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.usuarioService.findAll(req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador', 'Docente')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
    @Req() req: AuthRequest,
  ) {
    return this.usuarioService.update(id, updateUsuarioDto, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Put('estudiante/:id_matricula')
  actualizarEstudiante(
    @Param('id_matricula', ParseIntPipe) id_matricula: number,
    @Body()
    body: {
      usuario: UpdateUsuarioDto;
      matricula: {
        id_grado: number;
        id_seccion: number;
        id_periodo: number;
        estado: boolean;
      };
    },
    @Req() req: AuthRequest,
  ) {
    return this.usuarioService.actualizarEstudiante(
      id_matricula,
      body.usuario,
      body.matricula,
      req.user,
    );
  }
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.remove(id);
  }
}
