import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Nota } from './entities/nota.entity';
import { NotaService } from './nota.service';
import { NotaController } from './nota.controller';
import { EntregaTarea } from '../entrega-tarea/entities/entrega-tarea.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Nota, EntregaTarea])],
  controllers: [NotaController],
  providers: [NotaService],
})
export class NotaModule {}
