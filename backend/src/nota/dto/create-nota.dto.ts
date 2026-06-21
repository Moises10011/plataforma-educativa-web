import { IsInt, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateNotaDto {
  @IsInt()
  @IsOptional()
  id_entrega?: number;

  @IsInt()
  @IsNotEmpty()
  id_usuario_estudiante!: number;

  @IsInt()
  @IsOptional()
  id_competencia?: number;

  @IsString()
  @IsNotEmpty()
  valor!: string;

  @IsString()
  @IsOptional()
  observacion?: string;
}
