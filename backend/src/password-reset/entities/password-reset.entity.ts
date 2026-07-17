import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';

@Entity('password_Reset')
export class PasswordReset {
  @PrimaryGeneratedColumn({ name: 'id_reset' })
  id_reset!: number;

  @Column({ name: 'id_usuario' })
  id_usuario!: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  token!: string;

  @Column({ type: 'datetime' })
  fecha_expiracion!: Date;

  @Column({ type: 'boolean', default: false })
  usado!: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fecha_creacion!: Date;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario' })
  usuario!: Usuario;
}
