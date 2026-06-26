import { PartialType } from '@nestjs/mapped-types';
import { CreateLibretaDto } from './create-libreta.dto';

export class UpdateLibretaDto extends PartialType(CreateLibretaDto) {}
