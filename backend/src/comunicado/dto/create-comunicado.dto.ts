import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateComunicadoDto {
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsString()
  @IsNotEmpty()
  contenido!: string;

  @IsInt()
  @IsNotEmpty()
  id_usuario_admin!: number;
}
