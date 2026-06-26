import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import type { TipoDestinatario } from '../../destinatario/entities/destinatario.entity';

export class CreateDocumentoInstitucionalDto {
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsIn(['todos', 'estudiantes', 'docentes'])
  tipo!: TipoDestinatario;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id_grado?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id_seccion?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id_usuario?: number;
}
