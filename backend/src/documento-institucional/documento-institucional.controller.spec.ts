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
import { DocumentoInstitucionalService } from './documento-institucional.service';
import { CreateDocumentoInstitucionalDto } from './dto/create-documento-institucional.dto';
import { UpdateDocumentoInstitucionalDto } from './dto/update-documento-institucional.dto';
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

@Controller('documento-institucional')
export class DocumentoInstitucionalController {
  constructor(
    private readonly documentoService: DocumentoInstitucionalService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Post()
  @UseInterceptors(
    FileInterceptor('archivo', crearMulterConfig('documentos-institucionales')),
  )
  create(
    @Body() dto: CreateDocumentoInstitucionalDto,
    @Req() req: AuthRequest,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.documentoService.create(dto, req.user, archivo);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.documentoService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.documentoService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/descargar')
  async descargar(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const documento = await this.documentoService.findOne(id);
    const ruta = join(
      process.cwd(),
      'uploads',
      'documentos-institucionales',
      documento.archivo,
    );
    res.download(ruta);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Put(':id')
  @UseInterceptors(
    FileInterceptor('archivo', crearMulterConfig('documentos-institucionales')),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDocumentoInstitucionalDto,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.documentoService.update(id, dto, archivo);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.documentoService.remove(id);
  }
}
