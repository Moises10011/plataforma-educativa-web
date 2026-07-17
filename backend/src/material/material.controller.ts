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
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { join, extname } from 'path';
import { MaterialService } from './material.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { crearMulterConfig } from '../common/config/multer.config';

interface AuthRequest extends Request {
  user: { id_usuario: number; correo: string; roles?: string[] };
}

@Controller('material')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  // POST - crear material
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador', 'Docente')
  @Post()
  @UseInterceptors(FileInterceptor('archivo', crearMulterConfig('material')))
  create(
    @Body() createMaterialDto: CreateMaterialDto,
    @Req() req: AuthRequest,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.materialService.create(createMaterialDto, req.user, archivo);
  }

  // GET rutas específicas sin parámetros dinámicos
  @UseGuards(JwtAuthGuard)
  @Get('estudiante/mis-materiales')
  misMaterialesEstudiante(@Req() req: AuthRequest) {
    return this.materialService.findAll(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('docente/mis-materiales')
  misMaterialesDocente(@Req() req: AuthRequest) {
    return this.materialService.findAll(req.user);
  }

  // GET rutas con :id/subrutas - ANTES que :id solo
  @UseGuards(JwtAuthGuard)
  @Get(':id/descargar')
  async descargar(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @Query('modo') modo?: string,
  ) {
    const material = await this.materialService.findOne(id);

    if (!material.archivo) {
      res
        .status(404)
        .json({ message: 'Este material no tiene archivo adjunto' });
      return;
    }

    const ruta = join(process.cwd(), 'uploads', 'material', material.archivo);
    const ext = extname(material.archivo);
    const nombreBonito = `${material.titulo}${ext}`;

    if (modo === 'ver') {
      res.sendFile(ruta);
      return;
    }

    res.download(ruta, nombreBonito);
  }

  // GET :id - solo después de rutas específicas
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.materialService.findOne(id);
  }

  // GET general sin parámetros
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.materialService.findAll(req.user);
  }

  // PUT - actualizar material
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador', 'Docente')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMaterialDto: UpdateMaterialDto,
    @Req() req: AuthRequest,
  ) {
    return this.materialService.update(id, updateMaterialDto, req.user);
  }

  // DELETE - eliminar material
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador', 'Docente')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.materialService.remove(id, req.user);
  }
}
