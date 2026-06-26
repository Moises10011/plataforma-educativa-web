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
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { join } from 'path';
import { LibretaService } from './libreta.service';
import { CreateLibretaDto } from './dto/create-libreta.dto';
import { UpdateLibretaDto } from './dto/update-libreta.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { crearMulterConfig } from '../common/config/multer.config';

@Controller('libreta')
export class LibretaController {
  constructor(private readonly libretaService: LibretaService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Post()
  @UseInterceptors(FileInterceptor('archivo', crearMulterConfig('libretas')))
  create(
    @Body() dto: CreateLibretaDto,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.libretaService.create(dto, archivo);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.libretaService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.libretaService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/descargar')
  async descargar(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const libreta = await this.libretaService.findOne(id);
    const ruta = join(process.cwd(), 'uploads', 'libretas', libreta.archivo);
    res.download(ruta);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Put(':id')
  @UseInterceptors(FileInterceptor('archivo', crearMulterConfig('libretas')))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLibretaDto,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.libretaService.update(id, dto, archivo);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.libretaService.remove(id);
  }
}
