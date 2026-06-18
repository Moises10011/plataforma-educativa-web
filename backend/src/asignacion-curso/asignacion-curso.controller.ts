import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AsignacionCursoService } from './asignacion-curso.service';
import { CreateAsignacionCursoDto } from './dto/create-asignacion-curso.dto';
import { UpdateAsignacionCursoDto } from './dto/update-asignacion-curso.dto';

@Controller('asignacion-curso')
export class AsignacionCursoController {
  constructor(
    private readonly asignacionCursoService: AsignacionCursoService,
  ) {}

  @Post()
  create(@Body() createAsignacionCursoDto: CreateAsignacionCursoDto) {
    return this.asignacionCursoService.create(createAsignacionCursoDto);
  }

  @Get()
  findAll() {
    return this.asignacionCursoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.asignacionCursoService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAsignacionCursoDto: UpdateAsignacionCursoDto,
  ) {
    return this.asignacionCursoService.update(id, updateAsignacionCursoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.asignacionCursoService.remove(id);
  }
}
