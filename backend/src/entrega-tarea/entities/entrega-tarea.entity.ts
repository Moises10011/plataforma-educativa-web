import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tarea } from '../../tarea/entities/tarea.entity';
import { Usuario } from '../../usuario/entities/usuario.entity';

@Entity('Entrega_Tarea')
export class EntregaTarea {
  @PrimaryGeneratedColumn({ name: 'id_entrega' })
  id_entrega!: number;

  @Column({ name: 'id_tarea' })
  id_tarea!: number;

  @Column({ name: 'id_usuario_estudiante' })
  id_usuario_estudiante!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  archivo!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  comentario!: string;

  @Column({ type: 'datetime', nullable: true })
  fecha_entrega!: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  estado!: string;

  @ManyToOne(() => Tarea)
  @JoinColumn({ name: 'id_tarea' })
  tarea!: Tarea;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_estudiante' })
  estudiante!: Usuario;
}
