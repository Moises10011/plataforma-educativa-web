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
} from '@nestjs/common';
import { AsignacionCursoService } from './asignacion-curso.service';
import { CreateAsignacionCursoDto } from './dto/create-asignacion-curso.dto';
import { UpdateAsignacionCursoDto } from './dto/update-asignacion-curso.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('asignacion-curso')
export class AsignacionCursoController {
  constructor(
    private readonly asignacionCursoService: AsignacionCursoService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Post()
  create(@Body() createAsignacionCursoDto: CreateAsignacionCursoDto) {
    return this.asignacionCursoService.create(createAsignacionCursoDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.asignacionCursoService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.asignacionCursoService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAsignacionCursoDto: UpdateAsignacionCursoDto,
  ) {
    return this.asignacionCursoService.update(id, updateAsignacionCursoDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.asignacionCursoService.remove(id);
  }
}
