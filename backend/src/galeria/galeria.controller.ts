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
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { join } from 'path';
import { GaleriaService } from './galeria.service';
import { CreateGaleriaDto } from './dto/create-galeria.dto';
import { UpdateGaleriaDto } from './dto/update-galeria.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { crearMulterConfig } from '../common/config/multer.config';

@Controller('galeria')
export class GaleriaController {
  constructor(private readonly galeriaService: GaleriaService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Post()
  @UseInterceptors(FileInterceptor('imagen', crearMulterConfig('galeria')))
  create(
    @Body() createGaleriaDto: CreateGaleriaDto,
    @UploadedFile() imagen?: Express.Multer.File,
  ) {
    return this.galeriaService.create(createGaleriaDto, imagen);
  }

  @Get()
  findAll(@Query('tipo') tipo?: string) {
    return this.galeriaService.findAll(tipo);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.galeriaService.findOne(id);
  }

  @Get(':id/imagen')
  async verImagen(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const galeria = await this.galeriaService.findOne(id);

    if (!galeria.imagen) {
      res.status(404).json({ message: 'Este registro no tiene imagen' });
      return;
    }

    const ruta = join(process.cwd(), 'uploads', 'galeria', galeria.imagen);
    res.sendFile(ruta);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Put(':id')
  @UseInterceptors(FileInterceptor('imagen', crearMulterConfig('galeria')))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGaleriaDto: UpdateGaleriaDto,
    @UploadedFile() imagen?: Express.Multer.File,
  ) {
    return this.galeriaService.update(id, updateGaleriaDto, imagen);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.galeriaService.remove(id);
  }
}
