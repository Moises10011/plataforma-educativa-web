import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { extname } from 'path';

import { DocumentoInstitucionalService } from './documento-institucional.service';
import type { AuthUser } from './documento-institucional.service';
import { CreateDocumentoInstitucionalDto } from './dto/create-documento-institucional.dto';
import { UpdateDocumentoInstitucionalDto } from './dto/update-documento-institucional.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: AuthUser;
}

@Controller('documento-institucional')
export class DocumentoInstitucionalController {
  constructor(
    private readonly documentoInstitucionalService: DocumentoInstitucionalService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('archivo'))
  create(
    @Body() dto: CreateDocumentoInstitucionalDto,
    @Req() req: RequestWithUser,
    @UploadedFile() archivo: Express.Multer.File,
  ) {
    return this.documentoInstitucionalService.create(dto, req.user, archivo);
  }

  @Get()
  findAll() {
    return this.documentoInstitucionalService.findAll();
  }
  @Get('mis-documentos')
  @UseGuards(JwtAuthGuard)
  findParaUsuario(@Req() req: RequestWithUser) {
    return this.documentoInstitucionalService.findParaUsuario(req.user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.documentoInstitucionalService.findOne(id);
  }

  @Get(':id/descargar')
  async descargar(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const documento = await this.documentoInstitucionalService.findOne(id);
    const ruta = this.documentoInstitucionalService.getRutaArchivo(
      documento.archivo,
    );
    return res.download(
      ruta,
      `${documento.titulo}${extname(documento.archivo)}`,
    );
  }

  @Get(':id/ver')
  async ver(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const documento = await this.documentoInstitucionalService.findOne(id);
    const ruta = this.documentoInstitucionalService.getRutaArchivo(
      documento.archivo,
    );
    res.sendFile(ruta);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('archivo'))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDocumentoInstitucionalDto,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.documentoInstitucionalService.update(id, dto, archivo);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.documentoInstitucionalService.remove(id);
  }
}
