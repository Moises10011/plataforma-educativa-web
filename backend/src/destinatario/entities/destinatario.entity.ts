import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';
import { Grado } from '../../grado/entities/grado.entity';
import { Seccion } from '../../seccion/entities/seccion.entity';

export type TipoDestinatario = 'todos' | 'estudiantes' | 'docentes';
export type EntidadDestinatario = 'documento_institucional' | 'comunicado';

@Entity('destinatario')
@Index('idx_dest_entidad', ['entidad', 'entidad_id'])
@Index('idx_dest_tipo', ['tipo', 'id_grado', 'id_seccion'])
export class Destinatario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  entidad!: EntidadDestinatario;

  @Column({ name: 'entidad_id' })
  entidad_id!: number;

  @Column({ type: 'varchar', length: 20 })
  tipo!: TipoDestinatario;

  @Column({ name: 'id_grado', nullable: true })
  id_grado!: number | null;

  @ManyToOne(() => Grado, { nullable: true })
  @JoinColumn({ name: 'id_grado' })
  grado!: Grado | null;

  @Column({ name: 'id_seccion', nullable: true })
  id_seccion!: number | null;

  @ManyToOne(() => Seccion, { nullable: true })
  @JoinColumn({ name: 'id_seccion' })
  seccion!: Seccion | null;

  @Column({ name: 'id_usuario', nullable: true })
  id_usuario!: number | null;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'id_usuario' })
  usuario!: Usuario | null;
}
