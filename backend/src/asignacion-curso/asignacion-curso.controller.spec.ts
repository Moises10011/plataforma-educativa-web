import { Test, TestingModule } from '@nestjs/testing';
import { AsignacionCursoController } from './asignacion-curso.controller';
import { AsignacionCursoService } from './asignacion-curso.service';

describe('AsignacionCursoController', () => {
  let controller: AsignacionCursoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AsignacionCursoController],
      providers: [AsignacionCursoService],
    }).compile();

    controller = module.get<AsignacionCursoController>(
      AsignacionCursoController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
