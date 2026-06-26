import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHorarioDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  id_grado!: number;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  id_seccion!: number;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  id_periodo!: number;
}
