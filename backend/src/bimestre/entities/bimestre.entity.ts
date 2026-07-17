import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PeriodoAcademico } from '../../periodo-academico/entities/periodo-academico.entity';

@Entity('bimestre')
export class Bimestre {
  @PrimaryGeneratedColumn({ name: 'id_bimestre' })
  id_bimestre!: number;

  @Column({ name: 'id_periodo' })
  id_periodo!: number;

  @Column({ type: 'varchar', length: 50 })
  nombre!: string;

  @Column({ type: 'boolean', default: true })
  estado!: boolean;

  @ManyToOne(() => PeriodoAcademico)
  @JoinColumn({ name: 'id_periodo' })
  periodo!: PeriodoAcademico;
}
