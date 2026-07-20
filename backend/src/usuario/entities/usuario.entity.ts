import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Rol } from '../../rol/entities/rol.entity';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  id_usuario!: number;

  @Column({ type: 'varchar', length: 100 })
  nombres!: string;

  @Column({ type: 'varchar', length: 100 })
  apellidos!: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  dni!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion!: string;

  @Column({ type: 'date', nullable: true })
  fecha_nacimiento!: Date;

  @Column({ type: 'varchar', length: 150, unique: true })
  correo!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'boolean', default: true })
  estado!: boolean;

  @CreateDateColumn({ name: 'fecha_registro' })
  fecha_registro!: Date;

  @ManyToMany(() => Rol)
  @JoinTable({
    name: 'usuario_Rol',
    joinColumn: { name: 'id_usuario', referencedColumnName: 'id_usuario' },
    inverseJoinColumn: { name: 'id_rol', referencedColumnName: 'id_rol' },
  })
  roles!: Rol[];
}
