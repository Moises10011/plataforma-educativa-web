import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Institucion } from './entities/institucion.entity';
import { InstitucionService } from './institucion.service';
import { InstitucionController } from './institucion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Institucion])],
  controllers: [InstitucionController],
  providers: [InstitucionService],
})
export class InstitucionModule {}
