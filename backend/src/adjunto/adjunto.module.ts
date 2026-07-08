import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdjuntoService } from './adjunto.service';
import { AdjuntoController } from './adjunto.controller';
import { Adjunto } from './entities/adjunto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Adjunto])],
  controllers: [AdjuntoController],
  providers: [AdjuntoService],
  exports: [AdjuntoService],
})
export class AdjuntoModule {}
