import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AsignacionCurso } from '../../asignacion-curso/entities/asignacion-curso.entity';

@Entity('Material')
export class Material {
  @PrimaryGeneratedColumn({ name: 'id_material' })
  id_material!: number;

  @Column({ name: 'id_asignacion' })
  id_asignacion!: number;

  @Column({ type: 'varchar', length: 150 })
  titulo!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  archivo!: string;

  @CreateDateColumn({ name: 'fecha_publicacion' })
  fecha_publicacion!: Date;

  @ManyToOne(() => AsignacionCurso)
  @JoinColumn({ name: 'id_asignacion' })
  asignacion!: AsignacionCurso;
}
