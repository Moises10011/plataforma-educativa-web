import { Test, TestingModule } from '@nestjs/testing';
import { CompetenciaController } from './competencia.controller';
import { CompetenciaService } from './competencia.service';

describe('CompetenciaController', () => {
  let controller: CompetenciaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompetenciaController],
      providers: [CompetenciaService],
    }).compile();

    controller = module.get<CompetenciaController>(CompetenciaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
