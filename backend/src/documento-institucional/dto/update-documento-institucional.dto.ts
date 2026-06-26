import { PartialType } from '@nestjs/mapped-types';
import { CreateDocumentoInstitucionalDto } from './create-documento-institucional.dto';

export class UpdateDocumentoInstitucionalDto extends PartialType(
  CreateDocumentoInstitucionalDto,
) {}
