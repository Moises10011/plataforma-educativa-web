import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';
import { Curso } from '../../curso/entities/curso.entity';
import { Grado } from '../../grado/entities/grado.entity';
import { Seccion } from '../../seccion/entities/seccion.entity';
import { PeriodoAcademico } from '../../periodo-academico/entities/periodo-academico.entity';

@Entity('asignacion_curso')
export class AsignacionCurso {
  @PrimaryGeneratedColumn({ name: 'id_asignacion' })
  id_asignacion!: number;

  @Column({ name: 'id_usuario_docente' })
  id_usuario_docente!: number;

  @Column({ name: 'id_curso' })
  id_curso!: number;

  @Column({ name: 'id_grado' })
  id_grado!: number;

  @Column({ name: 'id_seccion' })
  id_seccion!: number;

  @Column({ name: 'id_periodo' })
  id_periodo!: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_docente' })
  docente!: Usuario;

  @ManyToOne(() => Curso)
  @JoinColumn({ name: 'id_curso' })
  curso!: Curso;

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
