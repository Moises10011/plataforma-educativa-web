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
import type { Request } from 'express';
import { EntregaTareaService } from './entrega-tarea.service';
import { CreateEntregaTareaDto } from './dto/create-entrega-tarea.dto';
import { UpdateEntregaTareaDto } from './dto/update-entrega-tarea.dto';
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

@Controller('entrega-tarea')
export class EntregaTareaController {
  constructor(private readonly entregaTareaService: EntregaTareaService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Estudiante')
  @Post()
  @UseInterceptors(
    FilesInterceptor('archivos', 10, crearMulterConfig('entregas')),
  )
  create(
    @Body() createEntregaTareaDto: CreateEntregaTareaDto,
    @Req() req: AuthRequest,
    @UploadedFiles() archivos?: Express.Multer.File[],
  ) {
    return this.entregaTareaService.create(
      createEntregaTareaDto,
      req.user,
      archivos,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('estudiante/mis-entregas')
  misEntregasEstudiante(@Req() req: AuthRequest) {
    return this.entregaTareaService.findAll(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.entregaTareaService.findAll(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.entregaTareaService.findOne(id);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Docente')
  @Put(':id/calificar')
  calificar(@Param('id', ParseIntPipe) id: number, @Body('nota') nota: string) {
    return this.entregaTareaService.calificar(id, nota);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Estudiante')
  @Put(':id')
  @UseInterceptors(
    FilesInterceptor('archivos', 10, crearMulterConfig('entregas')),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEntregaTareaDto: UpdateEntregaTareaDto,
    @Req() req: AuthRequest,
    @UploadedFiles() archivos?: Express.Multer.File[],
  ) {
    return this.entregaTareaService.update(
      id,
      updateEntregaTareaDto,
      req.user,
      archivos,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.entregaTareaService.remove(id);
  }
}
