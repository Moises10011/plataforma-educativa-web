import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Curso } from './entities/curso.entity';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';
import { Matricula } from '../matricula/entities/matricula.entity';
import { AsignacionCurso } from '../asignacion-curso/entities/asignacion-curso.entity';

@Injectable()
export class CursoService {
  constructor(
    @InjectRepository(Curso)
    private readonly cursoRepository: Repository<Curso>,
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
    @InjectRepository(AsignacionCurso)
    private readonly asignacionCursoRepository: Repository<AsignacionCurso>,
  ) {}

  async create(createCursoDto: CreateCursoDto) {
    const curso = this.cursoRepository.create(createCursoDto);
    return await this.cursoRepository.save(curso);
  }

  findAll() {
    return this.cursoRepository.find();
  }

  async findOne(id: number) {
    const curso = await this.cursoRepository.findOneBy({ id_curso: id });
    if (!curso) throw new NotFoundException(`Curso #${id} no encontrado`);
    return curso;
  }

  async update(id: number, updateCursoDto: UpdateCursoDto) {
    const curso = await this.findOne(id);
    Object.assign(curso, updateCursoDto);
    return await this.cursoRepository.save(curso);
  }

  async remove(id: number) {
    const curso = await this.findOne(id);
    await this.cursoRepository.remove(curso);
    return { message: `Curso #${id} eliminado correctamente` };
  }

  async findMisCursos(idUsuario: number) {
    // 1. Matrícula activa más reciente del estudiante
    const matricula = await this.matriculaRepository.findOne({
      where: { id_usuario: idUsuario, estado: true },
      order: { fecha_matricula: 'DESC' },
    });

    // 2. Todos los cursos existentes
    const cursos = await this.cursoRepository.find();

    if (!matricula) {
      return cursos.map((curso) => ({
        id_curso: curso.id_curso,
        nombre: curso.nombre,
        docente: 'No asignado',
      }));
    }

    // 3. Asignaciones para el grado/sección/periodo del estudiante
    const asignaciones = await this.asignacionCursoRepository.find({
      where: {
        id_grado: matricula.id_grado,
        id_seccion: matricula.id_seccion,
        id_periodo: matricula.id_periodo,
      },
      relations: { docente: true },
    });

    // 4. Mapa id_curso -> nombre del docente
    const docentePorCurso = new Map<number, string>();
    for (const asignacion of asignaciones) {
      docentePorCurso.set(
        asignacion.id_curso,
        `${asignacion.docente.nombres} ${asignacion.docente.apellidos}`,
      );
    }

    // 5. Combinar cursos con su docente (o "No asignado")
    return cursos.map((curso) => ({
      id_curso: curso.id_curso,
      nombre: curso.nombre,
      docente: docentePorCurso.get(curso.id_curso) ?? 'No asignado',
    }));
  }
}
