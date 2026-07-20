import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type TipoPeriodo = 'bimestral' | 'trimestral';

@Entity('periodo_Academico')
export class PeriodoAcademico {
  @PrimaryGeneratedColumn({ name: 'id_periodo' })
  id_periodo!: number;

  @Column({ type: 'varchar', length: 20 })
  nombre!: string;

  @Column({ type: 'int' })
  anio!: number;

  @Column({ type: 'date' })
  fecha_inicio!: Date;

  @Column({ type: 'date' })
  fecha_fin!: Date;

  @Column({ type: 'boolean', default: true })
  estado!: boolean;

  @Column({
    type: 'enum',
    enum: ['bimestral', 'trimestral'],
    default: 'bimestral',
  })
  tipo_periodo!: TipoPeriodo;
}
