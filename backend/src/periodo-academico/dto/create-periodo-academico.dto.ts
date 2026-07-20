import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
  IsIn,
} from 'class-validator';

export class CreatePeriodoAcademicoDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsInt()
  @Min(2000)
  anio!: number;

  @IsDateString()
  @IsNotEmpty()
  fecha_inicio!: string;

  @IsDateString()
  @IsNotEmpty()
  fecha_fin!: string;

  @IsBoolean()
  @IsOptional()
  estado?: boolean;

  @IsIn(['bimestral', 'trimestral'])
  @IsOptional()
  tipo_periodo?: 'bimestral' | 'trimestral';
}
