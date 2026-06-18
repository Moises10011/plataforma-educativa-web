import { Test, TestingModule } from '@nestjs/testing';
import { AsignacionCursoService } from './asignacion-curso.service';

describe('AsignacionCursoService', () => {
  let service: AsignacionCursoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AsignacionCursoService],
    }).compile();

    service = module.get<AsignacionCursoService>(AsignacionCursoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
