import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';

@Entity('documento_institucional')
export class DocumentoInstitucional {
  @PrimaryGeneratedColumn({ name: 'id_documento' })
  id_documento!: number;

  @Column({ type: 'varchar', length: 150 })
  titulo!: string;

  @Column({ type: 'text', nullable: true })
  descripcion!: string;

  @Column({ type: 'varchar', length: 255 })
  archivo!: string;

  @CreateDateColumn({ name: 'fecha_subida' })
  fecha_subida!: Date;

  @Column({ name: 'id_usuario_admin' })
  id_usuario_admin!: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_admin' })
  admin!: Usuario;
}
