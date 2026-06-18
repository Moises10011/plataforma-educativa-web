import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EntregaTarea } from './entities/entrega-tarea.entity';
import { EntregaTareaService } from './entrega-tarea.service';
import { EntregaTareaController } from './entrega-tarea.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EntregaTarea])],
  controllers: [EntregaTareaController],
  providers: [EntregaTareaService],
})
export class EntregaTareaModule {}
