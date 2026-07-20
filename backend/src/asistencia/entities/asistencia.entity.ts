import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AsignacionCurso } from '../../asignacion-curso/entities/asignacion-curso.entity';
import { Usuario } from '../../usuario/entities/usuario.entity';

@Entity('asistencia')
export class Asistencia {
  @PrimaryGeneratedColumn({ name: 'id_asistencia' })
  id_asistencia!: number;

  @Column({ name: 'id_asignacion' })
  id_asignacion!: number;

  @Column({ name: 'id_usuario_estudiante' })
  id_usuario_estudiante!: number;

  @Column({ type: 'date' })
  fecha!: Date;

  @Column({ type: 'varchar', length: 20 })
  estado!: string;

  @ManyToOne(() => AsignacionCurso)
  @JoinColumn({ name: 'id_asignacion' })
  asignacion!: AsignacionCurso;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_estudiante' })
  estudiante!: Usuario;
}
