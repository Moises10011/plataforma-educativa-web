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
import { EntregaTareaService } from './entrega-tarea.service';
import { CreateEntregaTareaDto } from './dto/create-entrega-tarea.dto';
import { UpdateEntregaTareaDto } from './dto/update-entrega-tarea.dto';

@Controller('entrega-tarea')
export class EntregaTareaController {
  constructor(private readonly entregaTareaService: EntregaTareaService) {}

  @Post()
  create(@Body() createEntregaTareaDto: CreateEntregaTareaDto) {
    return this.entregaTareaService.create(createEntregaTareaDto);
  }

  @Get()
  findAll() {
    return this.entregaTareaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.entregaTareaService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEntregaTareaDto: UpdateEntregaTareaDto,
  ) {
    return this.entregaTareaService.update(id, updateEntregaTareaDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.entregaTareaService.remove(id);
  }
}
