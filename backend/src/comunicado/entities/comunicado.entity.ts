import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';

@Entity('Comunicado')
export class Comunicado {
  @PrimaryGeneratedColumn({ name: 'id_comunicado' })
  id_comunicado!: number;

  @Column({ type: 'varchar', length: 150 })
  titulo!: string;

  @Column({ type: 'text' })
  contenido!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  archivo!: string;

  @CreateDateColumn({ name: 'fecha_publicacion' })
  fecha_publicacion!: Date;

  @Column({ name: 'id_usuario_admin' })
  id_usuario_admin!: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_admin' })
  admin!: Usuario;
}
