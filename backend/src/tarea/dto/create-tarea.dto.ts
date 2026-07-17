import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTareaDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  id_asignacion!: number;

  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsDateString()
  @IsOptional()
  fecha_entrega?: string;
}
