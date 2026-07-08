import { Test, TestingModule } from '@nestjs/testing';
import { AdjuntoController } from './adjunto.controller';
import { AdjuntoService } from './adjunto.service';

describe('AdjuntoController', () => {
  let controller: AdjuntoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdjuntoController],
      providers: [AdjuntoService],
    }).compile();

    controller = module.get<AdjuntoController>(AdjuntoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
