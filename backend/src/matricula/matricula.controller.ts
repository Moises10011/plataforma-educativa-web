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
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { MatriculaService } from './matricula.service';
import { CreateMatriculaDto } from './dto/create-matricula.dto';
import { UpdateMatriculaDto } from './dto/update-matricula.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

interface AuthRequest extends Request {
  user: {
    id_usuario: number;
    correo: string;
    roles?: string[];
  };
}

@Controller('matricula')
export class MatriculaController {
  constructor(private readonly matriculaService: MatriculaService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Post()
  create(@Body() createMatriculaDto: CreateMatriculaDto) {
    return this.matriculaService.create(createMatriculaDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.matriculaService.findAll(req.user);
  }
  @UseGuards(JwtAuthGuard)
  @Get('distribucion/grado')
  distribucionPorGrado() {
    return this.matriculaService.distribucionPorGrado();
  }

  @UseGuards(JwtAuthGuard)
  @Get('distribucion/seccion')
  distribucionPorSeccion() {
    return this.matriculaService.distribucionPorSeccion();
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Get('exportar/:id_periodo')
  async exportar(
    @Param('id_periodo', ParseIntPipe) id_periodo: number,
    @Res() res: Response,
  ) {
    const buffer = await this.matriculaService.exportarExcel(id_periodo);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=matriculados_${id_periodo}.xlsx`,
    });
    res.send(buffer);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.matriculaService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMatriculaDto: UpdateMatriculaDto,
  ) {
    return this.matriculaService.update(id, updateMatriculaDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.matriculaService.remove(id);
  }
}
