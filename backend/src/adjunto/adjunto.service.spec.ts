import { Test, TestingModule } from '@nestjs/testing';
import { AdjuntoService } from './adjunto.service';

describe('AdjuntoService', () => {
  let service: AdjuntoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdjuntoService],
    }).compile();

    service = module.get<AdjuntoService>(AdjuntoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
