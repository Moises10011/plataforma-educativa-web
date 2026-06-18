import { IsInt, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateMatriculaDto {
  @IsInt()
  @IsNotEmpty()
  id_usuario!: number;

  @IsInt()
  @IsNotEmpty()
  id_grado!: number;

  @IsInt()
  @IsNotEmpty()
  id_seccion!: number;

  @IsInt()
  @IsNotEmpty()
  id_periodo!: number;

  @IsBoolean()
  @IsOptional()
  estado?: boolean;
}
