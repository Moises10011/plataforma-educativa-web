import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('Galeria')
export class Galeria {
  @PrimaryGeneratedColumn({ name: 'id_galeria' })
  id_galeria!: number;

  @Column({ type: 'varchar', length: 150 })
  titulo!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imagen!: string;

  @Column({ type: 'varchar', length: 20 })
  tipo!: string;

  @CreateDateColumn({ name: 'fecha_publicacion' })
  fecha_publicacion!: Date;

  @Column({ type: 'boolean', default: true })
  estado!: boolean;
}
