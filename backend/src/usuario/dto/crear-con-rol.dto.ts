import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsDateString,
  IsEmail,
  Length,
  Matches,
} from 'class-validator';

export class CrearConRolDto {
  @IsString() @IsNotEmpty() nombres!: string;
  @IsString() @IsNotEmpty() apellidos!: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 8, { message: 'El DNI debe tener exactamente 8 dígitos' })
  @Matches(/^\d{8}$/, { message: 'El DNI solo debe contener números' })
  dni!: string;

  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  @IsNotEmpty()
  correo!: string;

  @IsString()
  @IsOptional()
  @Length(9, 9, { message: 'El teléfono debe tener exactamente 9 dígitos' })
  @Matches(/^\d{9}$/, { message: 'El teléfono solo debe contener números' })
  telefono?: string;

  @IsString() @IsOptional() direccion?: string;
  @IsDateString() @IsOptional() fecha_nacimiento?: string;

  @IsString() @IsNotEmpty() rol!: string;

  @IsInt() @IsOptional() id_grado?: number;
  @IsInt() @IsOptional() id_seccion?: number;
  @IsInt() @IsOptional() id_periodo?: number;
}
