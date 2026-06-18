import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateEntregaTareaDto {
  @IsInt()
  @IsNotEmpty()
  id_tarea!: number;

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
