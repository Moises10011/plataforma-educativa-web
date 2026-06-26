import { IsIn, IsInt, IsOptional, IsPositive } from 'class-validator';
import type {
  TipoDestinatario,
  EntidadDestinatario,
} from '../entities/destinatario.entity';

export class CreateDestinatarioDto {
  @IsIn(['documento_institucional', 'comunicado'])
  entidad!: EntidadDestinatario;

  @IsInt()
  @IsPositive()
  entidad_id!: number;

  @IsIn(['todos', 'estudiantes', 'docentes'])
  tipo!: TipoDestinatario;

  @IsOptional()
  @IsInt()
  @IsPositive()
  id_grado?: number | null;

  @IsOptional()
  @IsInt()
  @IsPositive()
  id_seccion?: number | null;

  @IsOptional()
  @IsInt()
  @IsPositive()
  id_usuario?: number | null;
}
