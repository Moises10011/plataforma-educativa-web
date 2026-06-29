import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsDateString,
} from 'class-validator';

export class CrearConRolDto {
  @IsString() @IsNotEmpty() nombres!: string;
  @IsString() @IsNotEmpty() apellidos!: string;
  @IsString() @IsNotEmpty() dni!: string;
  @IsString() @IsOptional() telefono?: string;
  @IsString() @IsOptional() direccion?: string;
  @IsDateString() @IsOptional() fecha_nacimiento?: string;

  @IsString() @IsNotEmpty() rol!: string;

  @IsInt() @IsOptional() id_grado?: number;
  @IsInt() @IsOptional() id_seccion?: number;
  @IsInt() @IsOptional() id_periodo?: number;
}
