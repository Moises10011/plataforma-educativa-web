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
} from '@nestjs/common';
import { CompetenciaService } from './competencia.service';
import { CreateCompetenciaDto } from './dto/create-competencia.dto';
import { UpdateCompetenciaDto } from './dto/update-competencia.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('competencia')
export class CompetenciaController {
  constructor(private readonly competenciaService: CompetenciaService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Post()
  create(@Body() createCompetenciaDto: CreateCompetenciaDto) {
    return this.competenciaService.create(createCompetenciaDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('id_curso') id_curso?: string) {
    return this.competenciaService.findAll(
      id_curso ? Number(id_curso) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.competenciaService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCompetenciaDto: UpdateCompetenciaDto,
  ) {
    return this.competenciaService.update(id, updateCompetenciaDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.competenciaService.remove(id);
  }
}
