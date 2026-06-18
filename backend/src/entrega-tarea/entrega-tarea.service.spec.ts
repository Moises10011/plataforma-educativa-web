import { Test, TestingModule } from '@nestjs/testing';
import { EntregaTareaService } from './entrega-tarea.service';

describe('EntregaTareaService', () => {
  let service: EntregaTareaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EntregaTareaService],
    }).compile();

    service = module.get<EntregaTareaService>(EntregaTareaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
