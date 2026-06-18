import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateAsignacionCursoDto {
  @IsInt()
  @IsNotEmpty()
  id_usuario_docente!: number;

  @IsInt()
  @IsNotEmpty()
  id_curso!: number;

  @IsInt()
  @IsNotEmpty()
  id_grado!: number;

  @IsInt()
  @IsNotEmpty()
  id_seccion!: number;

  @IsInt()
  @IsNotEmpty()
  id_periodo!: number;
}
