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
import { HorarioService } from './horario.service';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { UpdateHorarioDto } from './dto/update-horario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { crearMulterConfig } from '../common/config/multer.config';

@Controller('horario')
export class HorarioController {
  constructor(private readonly horarioService: HorarioService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Post()
  @UseInterceptors(FileInterceptor('archivo', crearMulterConfig('horarios')))
  create(
    @Body() dto: CreateHorarioDto,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.horarioService.create(dto, archivo);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.horarioService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.horarioService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/descargar')
  async descargar(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const horario = await this.horarioService.findOne(id);
    const ruta = join(process.cwd(), 'uploads', 'horarios', horario.archivo);
    res.download(ruta);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Put(':id')
  @UseInterceptors(FileInterceptor('archivo', crearMulterConfig('horarios')))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHorarioDto,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.horarioService.update(id, dto, archivo);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.horarioService.remove(id);
  }
}
