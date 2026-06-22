import { Test, TestingModule } from '@nestjs/testing';
import { CompetenciaService } from './competencia.service';

describe('CompetenciaService', () => {
  let service: CompetenciaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompetenciaService],
    }).compile();

    service = module.get<CompetenciaService>(CompetenciaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
