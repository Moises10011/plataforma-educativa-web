import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEntregaTareaDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  id_tarea!: number;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  id_usuario_estudiante!: number;

  @IsString()
  @IsOptional()
  comentario?: string;

  @IsIn(['AD', 'A', 'B', 'C'])
  @IsOptional()
  nota?: string;

  @IsDateString()
  @IsOptional()
  fecha_entrega?: string;

  @IsString()
  @IsOptional()
  estado?: string;
}
