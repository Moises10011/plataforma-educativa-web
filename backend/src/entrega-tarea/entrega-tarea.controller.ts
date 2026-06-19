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
} from '@nestjs/common';
import { Request } from 'express';
import { EntregaTareaService } from './entrega-tarea.service';
import { CreateEntregaTareaDto } from './dto/create-entrega-tarea.dto';
import { UpdateEntregaTareaDto } from './dto/update-entrega-tarea.dto';
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

@Controller('entrega-tarea')
export class EntregaTareaController {
  constructor(private readonly entregaTareaService: EntregaTareaService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Estudiante')
  @Post()
  create(
    @Body() createEntregaTareaDto: CreateEntregaTareaDto,
    @Req() req: AuthRequest,
  ) {
    return this.entregaTareaService.create(createEntregaTareaDto, req.user);
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
  @Roles('Estudiante')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEntregaTareaDto: UpdateEntregaTareaDto,
    @Req() req: AuthRequest,
  ) {
    return this.entregaTareaService.update(id, updateEntregaTareaDto, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.entregaTareaService.remove(id);
  }
}
