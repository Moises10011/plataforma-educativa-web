import { PartialType } from '@nestjs/mapped-types';
import { CreateEntregaTareaDto } from './create-entrega-tarea.dto';

export class UpdateEntregaTareaDto extends PartialType(CreateEntregaTareaDto) {}
