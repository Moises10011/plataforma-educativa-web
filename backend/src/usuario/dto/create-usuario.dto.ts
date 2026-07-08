import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsDateString,
  Length,
  Matches,
} from 'class-validator';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  nombres!: string;

  @IsString()
  @IsNotEmpty()
  apellidos!: string;

  @IsString()
  @IsOptional()
  @Length(8, 8, { message: 'El DNI debe tener 8 dígitos' })
  @Matches(/^\d{8}$/, { message: 'El DNI solo debe contener números' })
  dni?: string;

  @IsString()
  @IsOptional()
  @Length(9, 9, { message: 'El teléfono debe tener 9 dígitos' })
  @Matches(/^\d{9}$/, { message: 'El teléfono solo debe contener números' })
  telefono?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsDateString()
  @IsOptional()
  fecha_nacimiento?: string;

  @IsString()
  @IsOptional()
  correo?: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
