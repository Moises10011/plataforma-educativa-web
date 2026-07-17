import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  RelationId,
} from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';
import { Grado } from '../../grado/entities/grado.entity';
import { Seccion } from '../../seccion/entities/seccion.entity';

export type TipoDestinatario = 'todos' | 'estudiantes' | 'docentes';
export type EntidadDestinatario = 'documento_institucional' | 'comunicado';

@Entity('destinatario')
@Index('idx_dest_entidad', ['entidad', 'entidad_id'])
@Index('idx_dest_tipo', ['tipo'])
export class Destinatario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  entidad!: EntidadDestinatario;

  @Column({ name: 'entidad_id' })
  entidad_id!: number;

  @Column({ type: 'varchar', length: 20 })
  tipo!: TipoDestinatario;

  @ManyToOne(() => Grado, { nullable: true })
  @JoinColumn({ name: 'id_grado' })
  grado!: Grado | null;

  @RelationId((d: Destinatario) => d.grado)
  id_grado!: number | null;

  @ManyToOne(() => Seccion, { nullable: true })
  @JoinColumn({ name: 'id_seccion' })
  seccion!: Seccion | null;

  @RelationId((d: Destinatario) => d.seccion)
  id_seccion!: number | null;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'id_usuario' })
  usuario!: Usuario | null;

  @RelationId((d: Destinatario) => d.usuario)
  id_usuario!: number | null;
}
