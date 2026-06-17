import { IsString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  nombres!: string;

  @IsString()
  @IsNotEmpty()
  apellidos!: string;

  @IsEmail()
  @IsNotEmpty()
  correo!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
