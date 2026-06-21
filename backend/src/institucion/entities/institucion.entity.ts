import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('Institucion')
export class Institucion {
  @PrimaryGeneratedColumn({ name: 'id_institucion' })
  id_institucion!: number;

  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion!: string;

  @Column({ type: 'text', nullable: true })
  mision!: string;

  @Column({ type: 'text', nullable: true })
  vision!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono!: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  correo!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logo!: string;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fecha_actualizacion!: Date;
}
