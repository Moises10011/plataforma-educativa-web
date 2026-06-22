import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateCompetenciaDto {
  @IsInt()
  @IsNotEmpty()
  id_curso!: number;

  @IsString()
  @IsNotEmpty()
  nombre!: string;
}
