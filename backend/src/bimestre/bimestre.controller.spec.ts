import { Test, TestingModule } from '@nestjs/testing';
import { BimestreController } from './bimestre.controller';
import { BimestreService } from './bimestre.service';

describe('BimestreController', () => {
  let controller: BimestreController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BimestreController],
      providers: [BimestreService],
    }).compile();

    controller = module.get<BimestreController>(BimestreController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
