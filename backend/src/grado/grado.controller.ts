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
import { GradoService } from './grado.service';
import { CreateGradoDto } from './dto/create-grado.dto';
import { UpdateGradoDto } from './dto/update-grado.dto';

@Controller('grado')
export class GradoController {
  constructor(private readonly gradoService: GradoService) {}

  @Post()
  create(@Body() createGradoDto: CreateGradoDto) {
    return this.gradoService.create(createGradoDto);
  }

  @Get()
  findAll() {
    return this.gradoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.gradoService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGradoDto: UpdateGradoDto,
  ) {
    return this.gradoService.update(id, updateGradoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.gradoService.remove(id);
  }
}
