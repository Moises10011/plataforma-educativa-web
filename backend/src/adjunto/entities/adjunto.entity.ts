import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type EntidadAdjunto =
  | 'comunicado'
  | 'libreta'
  | 'horario'
  | 'documento_institucional'
  | 'galeria'
  | 'material'
  | 'entrega_tarea';

@Entity('adjunto')
@Index('idx_adjunto_entidad', ['entidad', 'entidad_id'])
export class Adjunto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  entidad!: EntidadAdjunto;

  @Column({ name: 'entidad_id' })
  entidad_id!: number;

  @Column({ type: 'varchar', length: 50 })
  carpeta!: string;

  @Column({ name: 'nombre_archivo', type: 'varchar', length: 255 })
  nombre_archivo!: string;

  @Column({ name: 'nombre_original', type: 'varchar', length: 255 })
  nombre_original!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mime_type!: string;

  @Column({ type: 'int' })
  tamano!: number;

  @CreateDateColumn({ name: 'fecha_subida' })
  fecha_subida!: Date;
}
