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
import { join } from 'path';
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
  @UseInterceptors(FileInterceptor('archivo', crearMulterConfig('entregas')))
  create(
    @Body() createEntregaTareaDto: CreateEntregaTareaDto,
    @Req() req: AuthRequest,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.entregaTareaService.create(
      createEntregaTareaDto,
      req.user,
      archivo,
    );
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

  @UseGuards(JwtAuthGuard)
  @Get(':id/descargar')
  async descargar(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const entrega = await this.entregaTareaService.findOne(id);

    if (!entrega.archivo) {
      res
        .status(404)
        .json({ message: 'Esta entrega no tiene archivo adjunto' });
      return;
    }

    const ruta = join(process.cwd(), 'uploads', 'entregas', entrega.archivo);
    res.download(ruta);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Estudiante')
  @Put(':id')
  @UseInterceptors(FileInterceptor('archivo', crearMulterConfig('entregas')))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEntregaTareaDto: UpdateEntregaTareaDto,
    @Req() req: AuthRequest,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.entregaTareaService.update(
      id,
      updateEntregaTareaDto,
      req.user,
      archivo,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.entregaTareaService.remove(id);
  }
}
