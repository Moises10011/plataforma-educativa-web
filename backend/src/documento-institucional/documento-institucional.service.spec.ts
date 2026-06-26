import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DocumentoInstitucionalService } from './documento-institucional.service';
import { DocumentoInstitucional } from './entities/documento-institucional.entity';

describe('DocumentoInstitucionalService', () => {
  let service: DocumentoInstitucionalService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentoInstitucionalService,
        {
          provide: getRepositoryToken(DocumentoInstitucional),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<DocumentoInstitucionalService>(
      DocumentoInstitucionalService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
