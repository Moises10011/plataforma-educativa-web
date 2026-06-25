import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Curso } from './entities/curso.entity';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';

@Injectable()
export class CursoService {
  constructor(
    @InjectRepository(Curso)
    private readonly cursoRepository: Repository<Curso>,
  ) {}

  async create(createCursoDto: CreateCursoDto) {
    const curso = this.cursoRepository.create(createCursoDto);
    return await this.cursoRepository.save(curso);
  }

  findAll() {
    return this.cursoRepository.find();
  }

  // ==========================================
  // NUEVA FUNCIÓN: Filtrar cursos por ID de Grado
  // ==========================================
  async findByGrado(idGrado: number) {
    return await this.cursoRepository
      .createQueryBuilder('curso')
      .innerJoin('asignacion_curso', 'ac', 'ac.id_curso = curso.id_curso')
      .where('ac.id_grado = :idGrado', { idGrado })
      .getMany();
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
}