import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Tarea } from './entities/tarea.entity';
import { TareaService } from './tarea.service';
import { TareaController } from './tarea.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tarea])],
  controllers: [TareaController],
  providers: [TareaService],
})
export class TareaModule {}
