import { IsInt, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMaterialDto {
  @Type(() => Number)
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
