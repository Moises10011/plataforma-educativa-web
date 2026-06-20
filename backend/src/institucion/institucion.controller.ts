import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InstitucionService } from './institucion.service';
import { UpdateInstitucionDto } from './dto/update-institucion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { crearMulterConfig } from '../common/config/multer.config';

@Controller('institucion')
export class InstitucionController {
  constructor(private readonly institucionService: InstitucionService) {}

  @Get()
  obtener() {
    return this.institucionService.obtener();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @Put()
  @UseInterceptors(FileInterceptor('logo', crearMulterConfig('institucion')))
  actualizar(
    @Body() updateInstitucionDto: UpdateInstitucionDto,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    return this.institucionService.actualizar(updateInstitucionDto, logo);
  }
}
