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
import { PeriodoAcademicoService } from './periodo-academico.service';
import { CreatePeriodoAcademicoDto } from './dto/create-periodo-academico.dto';
import { UpdatePeriodoAcademicoDto } from './dto/update-periodo-academico.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('periodo-academico')
export class PeriodoAcademicoController {
  constructor(
    private readonly periodoAcademicoService: PeriodoAcademicoService,
  ) {}

  @Post()
  create(@Body() createPeriodoAcademicoDto: CreatePeriodoAcademicoDto) {
    return this.periodoAcademicoService.create(createPeriodoAcademicoDto);
  }

  @Get()
  findAll() {
    return this.periodoAcademicoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.periodoAcademicoService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePeriodoAcademicoDto: UpdatePeriodoAcademicoDto,
  ) {
    return this.periodoAcademicoService.update(id, updatePeriodoAcademicoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.periodoAcademicoService.remove(id);
  }
}
