import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { AsignacionCurso } from '../asignacion-curso/entities/asignacion-curso.entity';
import { Matricula } from '../matricula/entities/matricula.entity';

interface AuthUser {
  id_usuario: number;
  roles?: string[];
}

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(AsignacionCurso)
    private readonly asignacionRepository: Repository<AsignacionCurso>,
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto) {
    const passwordEncriptado = await bcrypt.hash(createUsuarioDto.password, 10);

    const usuario = this.usuarioRepository.create({
      ...createUsuarioDto,
      password: passwordEncriptado,
    });

    return await this.usuarioRepository.save(usuario);
  }

  async findAll(authUser: AuthUser) {
    const esAdmin = authUser.roles?.includes('Administrador');

    if (esAdmin) {
      return this.usuarioRepository.find({ relations: { roles: true } });
    }

    // Docente: solo ve estudiantes de sus secciones asignadas
    const asignaciones = await this.asignacionRepository.find({
      where: { id_usuario_docente: authUser.id_usuario },
    });

    if (asignaciones.length === 0) return [];

    const combinaciones = asignaciones.map((a) => ({
      id_grado: a.id_grado,
      id_seccion: a.id_seccion,
      id_periodo: a.id_periodo,
    }));

    const matriculas = await this.matriculaRepository.find({
      relations: { usuario: true },
    });

    const idsEstudiantes = new Set<number>();

    for (const matricula of matriculas) {
      const coincide = combinaciones.some(
        (c) =>
          c.id_grado === matricula.id_grado &&
          c.id_seccion === matricula.id_seccion &&
          c.id_periodo === matricula.id_periodo,
      );
      if (coincide) idsEstudiantes.add(matricula.id_usuario);
    }

    return this.usuarioRepository.find({
      where: Array.from(idsEstudiantes).map((id) => ({ id_usuario: id })),
      relations: { roles: true },
    });
  }

  async findOne(id: number) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id_usuario: id },
      relations: { roles: true },
    });
    if (!usuario) throw new NotFoundException(`Usuario #${id} no encontrado`);
    return usuario;
  }

  async findMyProfile(authUser: AuthUser) {
    return this.findOne(authUser.id_usuario);
  }

  async update(
    id: number,
    updateUsuarioDto: UpdateUsuarioDto,
    authUser: AuthUser,
  ) {
    const esAdmin = authUser.roles?.includes('Administrador');
    const esPropio = authUser.id_usuario === id;

    if (!esAdmin && !esPropio) {
      throw new ForbiddenException(
        'No puedes modificar el perfil de otro usuario',
      );
    }

    const usuario = await this.findOne(id);

    if (updateUsuarioDto.password) {
      updateUsuarioDto.password = await bcrypt.hash(
        updateUsuarioDto.password,
        10,
      );
    }

    Object.assign(usuario, updateUsuarioDto);
    return await this.usuarioRepository.save(usuario);
  }

  async remove(id: number) {
    const usuario = await this.findOne(id);
    await this.usuarioRepository.remove(usuario);
    return { message: `Usuario #${id} eliminado correctamente` };
  }
}
