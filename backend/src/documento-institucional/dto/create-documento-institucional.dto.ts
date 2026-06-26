import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDocumentoInstitucionalDto {
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}
