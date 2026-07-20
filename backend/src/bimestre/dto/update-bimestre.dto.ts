import { PartialType } from '@nestjs/mapped-types';
import { CreateBimestreDto } from './create-bimestre.dto';

export class UpdateBimestreDto extends PartialType(CreateBimestreDto) {}
