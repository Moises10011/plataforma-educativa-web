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

  // ─── RUTAS ESTÁTICAS PRIMERO (antes de :id) ───────────────────────────────

  /**
   * GET /usuario/perfil/mi-perfil
   * Cualquier usuario autenticado puede ver su propio perfil
   */
  @UseGuards(JwtAuthGuard)
  @Get('perfil/mi-perfil')
  getMyProfile(@Req() req: AuthRequest) {
    return this.usuarioService.findMyProfile(req.user);
  }

  /**
   * GET /usuario/estadisticas/conteo
   * Pública: devuelve total de estudiantes y docentes
   */
  @Get('estadisticas/conteo')
  contarPorRol() {
    return this.usuarioService.contarPorRol();
  }

  /**
   * GET /usuario/estudiante/dashboard
   * Solo estudiantes autenticados
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Estudiante')
  @Get('estudiante/dashboard')
  getEstudianteDashboard(@Req() req: AuthRequest) {
    return this.usuarioService.getEstudianteDashboard(req.user);
  }

  /**
   * GET /usuario/docente/dashboard
   * Solo docentes autenticados
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Docente')
  @Get('docente/dashboard')
  getDocenteDashboard(@Req() req: AuthRequest) {
    return this.usuarioService.getDocenteDashboard(req.user);
  }

  /**
   * GET /usuario/admin/dashboard
   * Solo administradores autenticados
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Get('admin/dashboard')
  getAdminDashboard(@Req() req: AuthRequest) {
    return this.usuarioService.getAdminDashboard(req.user);
  }

  // ─── CRUD GENERAL ─────────────────────────────────────────────────────────

  /**
   * POST /usuario
   * Solo administradores pueden crear usuarios
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuarioService.create(createUsuarioDto);
  }

  /**
   * GET /usuario
   * Admin ve todos; Docente ve solo estudiantes de sus secciones
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador', 'Docente')
  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.usuarioService.findAll(req.user);
  }

  // ─── RUTAS CON PARÁMETRO :id AL FINAL ────────────────────────────────────

  /**
   * GET /usuario/:id
   * Admin y Docente pueden ver cualquier usuario por ID
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador', 'Docente')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.findOne(id);
  }

  /**
   * PUT /usuario/:id
   * Admin puede modificar cualquiera; usuario puede modificar solo el suyo
   */
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
    @Req() req: AuthRequest,
  ) {
    return this.usuarioService.update(id, updateUsuarioDto, req.user);
  }

  /**
   * DELETE /usuario/:id
   * Solo administradores
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.remove(id);
  }
}
