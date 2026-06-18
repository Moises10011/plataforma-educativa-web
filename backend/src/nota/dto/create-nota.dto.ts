import { IsInt, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateNotaDto {
  @IsInt()
  @IsNotEmpty()
  id_entrega!: number;

  @IsInt()
  @IsNotEmpty()
  id_usuario_estudiante!: number;

  @IsString()
  @IsNotEmpty()
  valor!: string;

  @IsString()
  @IsOptional()
  observacion?: string;
}
