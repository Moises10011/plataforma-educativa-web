import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsIn,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHorarioDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['estudiante', 'docente'])
  tipo!: 'estudiante' | 'docente';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_grado?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_seccion?: number;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  id_periodo!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_usuario_docente?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;
}
