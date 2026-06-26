import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLibretaDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  id_estudiante!: number;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  id_periodo!: number;
}
