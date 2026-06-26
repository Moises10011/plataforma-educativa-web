import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { DocumentoInstitucionalService } from './documento-institucional.service';
import type { AuthUser } from './documento-institucional.service';
import { CreateDocumentoInstitucionalDto } from './dto/create-documento-institucional.dto';
import { UpdateDocumentoInstitucionalDto } from './dto/update-documento-institucional.dto';

interface RequestWithUser extends Request {
  user: AuthUser;
}

@Controller('documento-institucional')
export class DocumentoInstitucionalController {
  constructor(
    private readonly documentoInstitucionalService: DocumentoInstitucionalService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('archivo'))
  create(
    @Body() createDocumentoInstitucionalDto: CreateDocumentoInstitucionalDto,
    @Req() req: RequestWithUser,
    @UploadedFile() archivo: Express.Multer.File,
  ) {
    return this.documentoInstitucionalService.create(
      createDocumentoInstitucionalDto,
      req.user,
      archivo,
    );
  }

  @Get()
  findAll() {
    return this.documentoInstitucionalService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentoInstitucionalService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDocumentoInstitucionalDto: UpdateDocumentoInstitucionalDto,
  ) {
    return this.documentoInstitucionalService.update(
      +id,
      updateDocumentoInstitucionalDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentoInstitucionalService.remove(+id);
  }
}
