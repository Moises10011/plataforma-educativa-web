import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateUsuarioRolDto {
  @IsInt()
  @IsNotEmpty()
  id_usuario!: number;

  @IsInt()
  @IsNotEmpty()
  id_rol!: number;
}
