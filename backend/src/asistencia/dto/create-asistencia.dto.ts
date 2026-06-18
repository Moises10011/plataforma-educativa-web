import { IsInt, IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateAsistenciaDto {
  @IsInt()
  @IsNotEmpty()
  id_asignacion!: number;

  @IsInt()
  @IsNotEmpty()
  id_usuario_estudiante!: number;

  @IsDateString()
  @IsNotEmpty()
  fecha!: string;

  @IsString()
  @IsNotEmpty()
  estado!: string;
}
