import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateTareaDto {
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
