import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bimestre } from './entities/bimestre.entity';
import { BimestreService } from './bimestre.service';
import { BimestreController } from './bimestre.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Bimestre])],
  controllers: [BimestreController],
  providers: [BimestreService],
  exports: [BimestreService],
})
export class BimestreModule {}
