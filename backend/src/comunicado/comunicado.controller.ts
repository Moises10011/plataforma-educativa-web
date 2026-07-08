import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
  Res,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { Request, Response } from 'express';
import { join } from 'path';
import { ComunicadoService } from './comunicado.service';
import { CreateComunicadoDto } from './dto/create-comunicado.dto';
import { UpdateComunicadoDto } from './dto/update-comunicado.dto';
import type { TipoDestinatario } from '../destinatario/entities/destinatario.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { crearMulterConfig } from '../common/config/multer.config';

interface AuthRequest extends Request {
  user: {
    id_usuario: number;
    correo: string;
    roles?: string[];
    id_grado?: number;
    id_seccion?: number;
  };
}

interface ComunicadoFormBody {
  titulo?: string;
  contenido?: string;
  destinatarios?: string | Record<string, unknown>[];
}

const MAX_ARCHIVOS = 10;

@Controller('comunicado')
export class ComunicadoController {
  constructor(private readonly comunicadoService: ComunicadoService) {}

  private async parsearYValidarDto(
    body: ComunicadoFormBody,
  ): Promise<CreateComunicadoDto> {
    let destinatarios: unknown;
    try {
      destinatarios =
        typeof body.destinatarios === 'string'
          ? JSON.parse(body.destinatarios)
          : body.destinatarios;
    } catch {
      throw new BadRequestException(
        'El campo destinatarios no es un JSON válido',
      );
    }

    const dto = plainToInstance(CreateComunicadoDto, {
      titulo: body.titulo,
      contenido: body.contenido,
      destinatarios,
    });

    const errores = await validate(dto);
    if (errores.length > 0) {
      const mensajes = errores
        .map((e) => Object.values(e.constraints ?? {}))
        .flat();
      throw new BadRequestException(mensajes);
    }

    return dto;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador', 'Docente')
  @Post()
  @UseInterceptors(
    FilesInterceptor(
      'archivos',
      MAX_ARCHIVOS,
      crearMulterConfig('comunicados'),
    ),
  )
  async create(
    @Body() body: ComunicadoFormBody,
    @Req() req: AuthRequest,
    @UploadedFiles() archivos?: Express.Multer.File[],
  ) {
    const dto = await this.parsearYValidarDto(body);
    return this.comunicadoService.create(dto, req.user, archivos ?? []);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Req() req: AuthRequest,
    @Query('tipo') tipo?: TipoDestinatario,
    @Query('id_grado') id_grado?: string,
    @Query('id_seccion') id_seccion?: string,
    @Query('id_usuario') id_usuario?: string,
  ) {
    const filtros = {
      tipo,
      id_grado: id_grado ? parseInt(id_grado, 10) : undefined,
      id_seccion: id_seccion ? parseInt(id_seccion, 10) : undefined,
      id_usuario: id_usuario ? parseInt(id_usuario, 10) : undefined,
    };
    return this.comunicadoService.findAllParaUsuario(req.user, filtros);
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
        .json({ message: 'Este comunicado no tiene archivo legado' });
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
  @UseInterceptors(
    FilesInterceptor(
      'archivos',
      MAX_ARCHIVOS,
      crearMulterConfig('comunicados'),
    ),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ComunicadoFormBody,
    @Req() req: AuthRequest,
    @UploadedFiles() archivos?: Express.Multer.File[],
  ) {
    let dto: UpdateComunicadoDto = {
      titulo: body.titulo,
      contenido: body.contenido,
    };

    if (body.destinatarios) {
      const parsed = await this.parsearYValidarDto(body);
      dto = { ...dto, destinatarios: parsed.destinatarios };
    }

    return this.comunicadoService.update(id, dto, req.user, archivos ?? []);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.comunicadoService.remove(id);
  }
}
