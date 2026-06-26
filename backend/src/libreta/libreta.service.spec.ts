import { Test, TestingModule } from '@nestjs/testing';
import { LibretaService } from './libreta.service';

describe('LibretaService', () => {
  let service: LibretaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LibretaService],
    }).compile();

    service = module.get<LibretaService>(LibretaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
