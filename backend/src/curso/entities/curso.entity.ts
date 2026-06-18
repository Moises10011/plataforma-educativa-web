import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('Curso')
export class Curso {
  @PrimaryGeneratedColumn({ name: 'id_curso' })
  id_curso!: number;

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion!: string;
}
