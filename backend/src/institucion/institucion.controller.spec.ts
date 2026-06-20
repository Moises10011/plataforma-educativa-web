import { Test, TestingModule } from '@nestjs/testing';
import { InstitucionController } from './institucion.controller';
import { InstitucionService } from './institucion.service';

describe('InstitucionController', () => {
  let controller: InstitucionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstitucionController],
      providers: [InstitucionService],
    }).compile();

    controller = module.get<InstitucionController>(InstitucionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
