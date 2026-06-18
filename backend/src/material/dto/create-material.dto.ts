import { IsInt, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateMaterialDto {
  @IsInt()
  @IsNotEmpty()
  id_asignacion!: number;

  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  archivo?: string;
}
