import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('Grado')
export class Grado {
  @PrimaryGeneratedColumn({ name: 'id_grado' })
  id_grado!: number;

  @Column({ type: 'varchar', length: 20 })
  nombre!: string;
}
