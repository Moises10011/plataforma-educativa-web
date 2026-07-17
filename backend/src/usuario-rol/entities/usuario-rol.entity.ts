import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';
import { Rol } from '../../rol/entities/rol.entity';

@Entity('usuario_Rol')
export class UsuarioRol {
  @PrimaryColumn({ name: 'id_usuario' })
  id_usuario!: number;

  @PrimaryColumn({ name: 'id_rol' })
  id_rol!: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario' })
  usuario!: Usuario;

  @ManyToOne(() => Rol)
  @JoinColumn({ name: 'id_rol' })
  rol!: Rol;
}
