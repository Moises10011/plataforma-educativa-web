import { Test, TestingModule } from '@nestjs/testing';
import { LibretaController } from './libreta.controller';
import { LibretaService } from './libreta.service';

describe('LibretaController', () => {
  let controller: LibretaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LibretaController],
      providers: [LibretaService],
    }).compile();

    controller = module.get<LibretaController>(LibretaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
