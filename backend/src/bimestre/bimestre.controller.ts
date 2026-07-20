import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { BimestreService } from './bimestre.service';
import { CreateBimestreDto } from './dto/create-bimestre.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bimestre')
export class BimestreController {
  constructor(private readonly bimestreService: BimestreService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateBimestreDto) {
    return this.bimestreService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findByPeriodo(@Query('id_periodo', ParseIntPipe) id_periodo: number) {
    return this.bimestreService.findByPeriodo(id_periodo);
  }
}
