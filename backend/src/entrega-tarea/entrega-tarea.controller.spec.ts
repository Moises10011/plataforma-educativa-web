import { Test, TestingModule } from '@nestjs/testing';
import { EntregaTareaController } from './entrega-tarea.controller';
import { EntregaTareaService } from './entrega-tarea.service';

describe('EntregaTareaController', () => {
  let controller: EntregaTareaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntregaTareaController],
      providers: [EntregaTareaService],
    }).compile();

    controller = module.get<EntregaTareaController>(EntregaTareaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
