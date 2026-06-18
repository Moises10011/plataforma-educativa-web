import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('Seccion')
export class Seccion {
  @PrimaryGeneratedColumn({ name: 'id_seccion' })
  id_seccion!: number;

  @Column({ type: 'varchar', length: 10 })
  nombre!: string;
}
