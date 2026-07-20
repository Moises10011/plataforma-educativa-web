import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';
import { Grado } from '../../grado/entities/grado.entity';
import { Seccion } from '../../seccion/entities/seccion.entity';
import { PeriodoAcademico } from '../../periodo-academico/entities/periodo-academico.entity';

@Entity('matricula')
export class Matricula {
  @PrimaryGeneratedColumn({ name: 'id_matricula' })
  id_matricula!: number;

  @Column({ name: 'id_usuario' })
  id_usuario!: number;

  @Column({ name: 'id_grado' })
  id_grado!: number;

  @Column({ name: 'id_seccion' })
  id_seccion!: number;

  @Column({ name: 'id_periodo' })
  id_periodo!: number;

  @CreateDateColumn({ name: 'fecha_matricula' })
  fecha_matricula!: Date;

  @Column({ type: 'boolean', default: true })
  estado!: boolean;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario' })
  usuario!: Usuario;

  @ManyToOne(() => Grado)
  @JoinColumn({ name: 'id_grado' })
  grado!: Grado;

  @ManyToOne(() => Seccion)
  @JoinColumn({ name: 'id_seccion' })
  seccion!: Seccion;

  @ManyToOne(() => PeriodoAcademico)
  @JoinColumn({ name: 'id_periodo' })
  periodo!: PeriodoAcademico;
}
