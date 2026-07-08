import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsIn,
  IsOptional,
  IsInt,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { TipoDestinatario } from '../../destinatario/entities/destinatario.entity';

const TIPOS_VALIDOS: TipoDestinatario[] = ['todos', 'estudiantes', 'docentes'];

export class DestinatarioDto {
  @IsIn(TIPOS_VALIDOS, {
    message: 'tipo debe ser todos, estudiantes o docentes',
  })
  tipo!: TipoDestinatario;

  @IsOptional()
  @IsInt()
  id_grado?: number;

  @IsOptional()
  @IsInt()
  id_seccion?: number;

  // Docente puntual (solo aplica junto con tipo = 'docentes')
  @IsOptional()
  @IsInt()
  id_usuario?: number;
}

export class CreateComunicadoDto {
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsString()
  @IsNotEmpty()
  contenido!: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Debes seleccionar al menos un destinatario' })
  @ValidateNested({ each: true })
  @Type(() => DestinatarioDto)
  destinatarios!: DestinatarioDto[];
}
