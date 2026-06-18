import { Test, TestingModule } from '@nestjs/testing';
import { PeriodoAcademicoController } from './periodo-academico.controller';
import { PeriodoAcademicoService } from './periodo-academico.service';

describe('PeriodoAcademicoController', () => {
  let controller: PeriodoAcademicoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PeriodoAcademicoController],
      providers: [PeriodoAcademicoService],
    }).compile();

    controller = module.get<PeriodoAcademicoController>(
      PeriodoAcademicoController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
