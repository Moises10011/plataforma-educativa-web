import { PartialType } from '@nestjs/mapped-types';
import { CreateAsignacionCursoDto } from './create-asignacion-curso.dto';

export class UpdateAsignacionCursoDto extends PartialType(
  CreateAsignacionCursoDto,
) {}
