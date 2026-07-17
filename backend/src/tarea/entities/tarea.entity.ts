import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AsignacionCurso } from '../../asignacion-curso/entities/asignacion-curso.entity';

@Entity('Tarea')
export class Tarea {
  @PrimaryGeneratedColumn({ name: 'id_tarea' })
  id_tarea!: number;

  @Column({ name: 'id_asignacion' })
  id_asignacion!: number;

  @Column({ type: 'varchar', length: 150 })
  titulo!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion!: string;

  @CreateDateColumn({ name: 'fecha_publicacion' })
  fecha_publicacion!: Date;

  @Column({ type: 'datetime', nullable: true })
  fecha_entrega!: Date;

  @Column({ type: 'simple-json', nullable: true })
  archivos!: string[] | null;

  @ManyToOne(() => AsignacionCurso)
  @JoinColumn({ name: 'id_asignacion' })
  asignacion!: AsignacionCurso;
}
