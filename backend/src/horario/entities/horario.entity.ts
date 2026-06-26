import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AsignacionCurso } from '../../asignacion-curso/entities/asignacion-curso.entity';

@Entity('horario')
export class HorariosEntity {
  @PrimaryGeneratedColumn()
  id_horario!: number;

  @Column()
  dia_semana!: string;

  @Column({ type: 'time' })
  hora_inicio!: string;

  @Column({ type: 'time' })
  hora_fin!: string;

  @Column()
  id_asignacion!: number;

  @ManyToOne(() => AsignacionCurso)
  @JoinColumn({ name: 'id_asignacion' })
  asignacion!: AsignacionCurso;
}