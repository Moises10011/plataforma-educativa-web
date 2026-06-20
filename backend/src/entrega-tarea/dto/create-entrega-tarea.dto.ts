import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
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
  archivo?: string;

  @IsString()
  @IsOptional()
  comentario?: string;

  @IsDateString()
  @IsOptional()
  fecha_entrega?: string;

  @IsString()
  @IsOptional()
  estado?: string;
}
