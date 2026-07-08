import { PartialType } from '@nestjs/mapped-types';
import { CreateAdjuntoDto } from './create-adjunto.dto';

export class UpdateAdjuntoDto extends PartialType(CreateAdjuntoDto) {}
