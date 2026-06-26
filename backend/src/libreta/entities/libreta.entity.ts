import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';
import { PeriodoAcademico } from '../../periodo-academico/entities/periodo-academico.entity';

@Entity('Libreta')
export class Libreta {
  @PrimaryGeneratedColumn({ name: 'id_libreta' })
  id_libreta!: number;

  @Column({ type: 'varchar', length: 255 })
  archivo!: string;

  @CreateDateColumn({ name: 'fecha_subida' })
  fecha_subida!: Date;

  @Column({ name: 'id_estudiante' })
  id_estudiante!: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_estudiante' })
  estudiante!: Usuario;

  @Column({ name: 'id_periodo' })
  id_periodo!: number;

  @ManyToOne(() => PeriodoAcademico)
  @JoinColumn({ name: 'id_periodo' })
  periodo!: PeriodoAcademico;
}
