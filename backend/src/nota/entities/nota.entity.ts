import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EntregaTarea } from '../../entrega-tarea/entities/entrega-tarea.entity';
import { Usuario } from '../../usuario/entities/usuario.entity';
import { Competencia } from '../../competencia/entities/competencia.entity';

@Entity('nota')
export class Nota {
  @PrimaryGeneratedColumn({ name: 'id_nota' })
  id_nota!: number;

  @Column({ name: 'id_entrega', nullable: true })
  id_entrega!: number;

  @Column({ name: 'id_usuario_estudiante' })
  id_usuario_estudiante!: number;

  @Column({ name: 'id_competencia', nullable: true })
  id_competencia!: number;

  @Column({ type: 'varchar', length: 5 })
  valor!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  observacion!: string;

  @CreateDateColumn({ name: 'fecha_registro' })
  fecha_registro!: Date;

  @ManyToOne(() => EntregaTarea, { nullable: true })
  @JoinColumn({ name: 'id_entrega' })
  entrega!: EntregaTarea;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_estudiante' })
  estudiante!: Usuario;

  @ManyToOne(() => Competencia, { nullable: true })
  @JoinColumn({ name: 'id_competencia' })
  competencia!: Competencia;
}
