import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('Usuario')
export class Usuario {
  @PrimaryGeneratedColumn({
    name: 'id_usuario',
  })
  id_usuario!: number;

  @Column({
    type: 'varchar',
    length: 100,
  })
  nombres!: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  apellidos!: string;

  @Column({
    type: 'varchar',
    length: 150,
    unique: true,
  })
  correo!: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  password!: string;

  @Column({
    type: 'boolean',
    default: true,
  })
  estado!: boolean;

  @CreateDateColumn({
    name: 'fecha_registro',
  })
  fecha_registro!: Date;
}
