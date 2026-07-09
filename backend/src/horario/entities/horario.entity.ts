import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Grado } from '../../grado/entities/grado.entity';
import { Seccion } from '../../seccion/entities/seccion.entity';
import { PeriodoAcademico } from '../../periodo-academico/entities/periodo-academico.entity';
import { Usuario } from '../../usuario/entities/usuario.entity';

@Entity('Horario')
export class Horario {
  @PrimaryGeneratedColumn({ name: 'id_horario' })
  id_horario!: number;

  @Column({ type: 'varchar', length: 20, default: 'estudiante' })
  tipo!: 'estudiante' | 'docente';

  @Column({ type: 'varchar', length: 255 })
  archivo!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  descripcion!: string;

  @CreateDateColumn({ name: 'fecha_subida' })
  fecha_subida!: Date;

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

  @Column({ name: 'id_periodo' })
  id_periodo!: number;

  @ManyToOne(() => PeriodoAcademico)
  @JoinColumn({ name: 'id_periodo' })
  periodo!: PeriodoAcademico;

  @Column({ name: 'id_usuario_docente', nullable: true })
  id_usuario_docente!: number | null;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'id_usuario_docente' })
  docente!: Usuario | null;
}
