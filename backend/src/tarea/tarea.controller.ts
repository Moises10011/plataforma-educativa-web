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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { TareaService } from './tarea.service';
import { CreateTareaDto } from './dto/create-tarea.dto';
import { UpdateTareaDto } from './dto/update-tarea.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { crearMulterConfig } from '../common/config/multer.config';

interface AuthRequest extends Request {
  user: {
    id_usuario: number;
    correo: string;
    roles?: string[];
  };
}

@Controller('tarea')
export class TareaController {
  constructor(private readonly tareaService: TareaService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Docente')
  @Post()
  @UseInterceptors(
    FilesInterceptor('archivos', 10, crearMulterConfig('tareas')),
  )
  create(
    @Body() createTareaDto: CreateTareaDto,
    @Req() req: AuthRequest,
    @UploadedFiles() archivos?: Express.Multer.File[],
  ) {
    return this.tareaService.create(createTareaDto, req.user, archivos);
  }

  @UseGuards(JwtAuthGuard)
  @Get('estudiante/mis-tareas')
  misTareasEstudiante(@Req() req: AuthRequest) {
    return this.tareaService.findAll(req.user);
  }
  @UseGuards(JwtAuthGuard)
  @Get('estudiante/pendientes')
  misTareasPendientes(@Req() req: AuthRequest) {
    return this.tareaService.findPendientesEstudiante(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('docente/mis-tareas')
  misTareasDocente(@Req() req: AuthRequest) {
    return this.tareaService.findAll(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.tareaService.findAll(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tareaService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Docente')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTareaDto: UpdateTareaDto,
    @Req() req: AuthRequest,
  ) {
    return this.tareaService.update(id, updateTareaDto, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Docente')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.tareaService.remove(id, req.user);
  }
}
