import { IsNotEmpty, IsString } from 'class-validator';

export class CreateComunicadoDto {
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsString()
  @IsNotEmpty()
  contenido!: string;
}
