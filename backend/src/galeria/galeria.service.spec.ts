import { Test, TestingModule } from '@nestjs/testing';
import { GaleriaService } from './galeria.service';

describe('GaleriaService', () => {
  let service: GaleriaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GaleriaService],
    }).compile();

    service = module.get<GaleriaService>(GaleriaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
