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
  UseGuards,
  Res,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { join } from 'path';
import { LibretaService } from './libreta.service';
import { CreateLibretaDto } from './dto/create-libreta.dto';
import { UpdateLibretaDto } from './dto/update-libreta.dto';
import { SubidaMasivaDto } from './dto/subida-masiva.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { crearMulterConfig } from '../common/config/multer.config';
import { ForbiddenException } from '@nestjs/common';

import { Req } from '@nestjs/common';
import type { Request } from 'express';

interface AuthRequest extends Request {
  user: { id_usuario: number; correo: string; roles?: string[] };
}

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Post('masiva')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FilesInterceptor('archivos', 100, crearMulterConfig('libretas')),
  )
  async subirMasiva(
    @Body() dto: SubidaMasivaDto,
    @UploadedFiles() archivos?: Express.Multer.File[],
  ) {
    return this.libretaService.subirMasiva(
      dto.id_grado,
      dto.id_seccion,
      dto.id_periodo,
      archivos || [],
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('id_grado') id_grado?: string,
    @Query('id_seccion') id_seccion?: string,
    @Query('id_periodo') id_periodo?: string,
    @Query('id_estudiante') id_estudiante?: string,
  ) {
    return this.libretaService.findAll({
      id_grado: id_grado ? +id_grado : undefined,
      id_seccion: id_seccion ? +id_seccion : undefined,
      id_periodo: id_periodo ? +id_periodo : undefined,
      id_estudiante: id_estudiante ? +id_estudiante : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('estudiantes/:id_grado/:id_seccion/:id_periodo')
  findEstudiantesConLibreta(
    @Param('id_grado', ParseIntPipe) id_grado: number,
    @Param('id_seccion', ParseIntPipe) id_seccion: number,
    @Param('id_periodo', ParseIntPipe) id_periodo: number,
  ) {
    return this.libretaService.findEstudiantesConLibreta(
      id_grado,
      id_seccion,
      id_periodo,
    );
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Estudiante')
  @Get('estudiante/mis-libretas')
  misLibretas(@Req() req: AuthRequest) {
    return this.libretaService.findAll({ id_estudiante: req.user.id_usuario });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.libretaService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/descargar')
  async descargar(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthRequest,
    @Res() res: Response,
  ) {
    const libreta = await this.libretaService.findOne(id);
    this.verificarAccesoEstudiante(libreta, req.user);
    const ruta = join(process.cwd(), 'uploads', 'libretas', libreta.archivo);
    res.download(ruta);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/ver')
  async ver(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthRequest,
    @Res() res: Response,
  ) {
    const libreta = await this.libretaService.findOne(id);
    this.verificarAccesoEstudiante(libreta, req.user);
    const ruta = join(process.cwd(), 'uploads', 'libretas', libreta.archivo);
    res.sendFile(ruta);
  }

  private verificarAccesoEstudiante(
    libreta: { id_estudiante: number },
    user: { id_usuario: number; roles?: string[] },
  ) {
    const esEstudiante = user.roles?.includes('Estudiante');
    const esPropietario = libreta.id_estudiante === user.id_usuario;
    if (esEstudiante && !esPropietario) {
      throw new ForbiddenException(
        'No puedes ver la libreta de otro estudiante',
      );
    }
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
