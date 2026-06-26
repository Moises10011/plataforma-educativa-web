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

@Entity('Horario')
export class Horario {
  @PrimaryGeneratedColumn({ name: 'id_horario' })
  id_horario!: number;

  @Column({ type: 'varchar', length: 255 })
  archivo!: string;

  @CreateDateColumn({ name: 'fecha_subida' })
  fecha_subida!: Date;

  @Column({ name: 'id_grado' })
  id_grado!: number;

  @ManyToOne(() => Grado)
  @JoinColumn({ name: 'id_grado' })
  grado!: Grado;

  @Column({ name: 'id_seccion' })
  id_seccion!: number;

  @ManyToOne(() => Seccion)
  @JoinColumn({ name: 'id_seccion' })
  seccion!: Seccion;

  @Column({ name: 'id_periodo' })
  id_periodo!: number;

  @ManyToOne(() => PeriodoAcademico)
  @JoinColumn({ name: 'id_periodo' })
  periodo!: PeriodoAcademico;
}
