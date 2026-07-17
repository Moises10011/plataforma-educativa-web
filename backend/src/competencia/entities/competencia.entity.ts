import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Curso } from '../../curso/entities/curso.entity';

@Entity('competencia')
export class Competencia {
  @PrimaryGeneratedColumn({ name: 'id_competencia' })
  id_competencia!: number;

  @Column({ name: 'id_curso' })
  id_curso!: number;

  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @ManyToOne(() => Curso)
  @JoinColumn({ name: 'id_curso' })
  curso!: Curso;
}
