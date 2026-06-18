import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CreatePeriodoAcademicoDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsDateString()
  @IsNotEmpty()
  fecha_inicio!: string;

  @IsDateString()
  @IsNotEmpty()
  fecha_fin!: string;

  @IsBoolean()
  @IsOptional()
  estado?: boolean;
}
