import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateGaleriaDto {
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsIn(['BANNER', 'GALERIA', 'EVENTO'])
  tipo!: string;
}
