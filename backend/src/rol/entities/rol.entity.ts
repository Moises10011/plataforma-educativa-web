import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('Rol')
export class Rol {
  @PrimaryGeneratedColumn({ name: 'id_rol' })
  id_rol!: number;

  @Column({ type: 'varchar', length: 50 })
  nombre_rol!: string;
}
