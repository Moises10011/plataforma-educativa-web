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
import { ComunicadoService } from './comunicado.service';
import { CreateComunicadoDto } from './dto/create-comunicado.dto';
import { UpdateComunicadoDto } from './dto/update-comunicado.dto';
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

@Controller('comunicado')
export class ComunicadoController {
  constructor(private readonly comunicadoService: ComunicadoService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador', 'Docente')
  @Post()
  @UseInterceptors(FileInterceptor('archivo', crearMulterConfig('comunicados')))
  create(
    @Body() createComunicadoDto: CreateComunicadoDto,
    @Req() req: AuthRequest,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.comunicadoService.create(
      createComunicadoDto,
      req.user,
      archivo,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.comunicadoService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.comunicadoService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/descargar')
  async descargar(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const comunicado = await this.comunicadoService.findOne(id);

    if (!comunicado.archivo) {
      res
        .status(404)
        .json({ message: 'Este comunicado no tiene archivo adjunto' });
      return;
    }

    const ruta = join(
      process.cwd(),
      'uploads',
      'comunicados',
      comunicado.archivo,
    );
    res.download(ruta);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador', 'Docente')
  @Put(':id')
  @UseInterceptors(FileInterceptor('archivo', crearMulterConfig('comunicados')))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateComunicadoDto: UpdateComunicadoDto,
    @Req() req: AuthRequest,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.comunicadoService.update(
      id,
      updateComunicadoDto,
      req.user,
      archivo,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.comunicadoService.remove(id);
  }
}
