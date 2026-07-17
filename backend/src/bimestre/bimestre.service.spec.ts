import { Test, TestingModule } from '@nestjs/testing';
import { BimestreService } from './bimestre.service';

describe('BimestreService', () => {
  let service: BimestreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BimestreService],
    }).compile();

    service = module.get<BimestreService>(BimestreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
