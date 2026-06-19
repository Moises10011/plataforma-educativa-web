import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Material } from './entities/material.entity';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { AsignacionCurso } from '../asignacion-curso/entities/asignacion-curso.entity';
import { Matricula } from '../matricula/entities/matricula.entity';

interface AuthUser {
  id_usuario: number;
  roles?: string[];
}

@Injectable()
export class MaterialService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
    @InjectRepository(AsignacionCurso)
    private readonly asignacionRepository: Repository<AsignacionCurso>,
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
  ) {}

  async create(createMaterialDto: CreateMaterialDto, authUser: AuthUser) {
    const esAdmin = authUser.roles?.includes('Administrador');

    if (!esAdmin) {
      const asignacion = await this.asignacionRepository.findOneBy({
        id_asignacion: createMaterialDto.id_asignacion,
      });
      if (
        !asignacion ||
        asignacion.id_usuario_docente !== authUser.id_usuario
      ) {
        throw new ForbiddenException(
          'No puedes crear material en una asignacion que no es tuya',
        );
      }
    }

    const material = this.materialRepository.create(createMaterialDto);
    return await this.materialRepository.save(material);
  }

  async findAll(authUser: AuthUser) {
    const esAdmin = authUser.roles?.includes('Administrador');
    const esDocente = authUser.roles?.includes('Docente');
    const esEstudiante = authUser.roles?.includes('Estudiante');

    const todos = await this.materialRepository.find({
      relations: { asignacion: true },
    });

    if (esAdmin) return todos;

    if (esDocente) {
      return todos.filter(
        (m) => m.asignacion.id_usuario_docente === authUser.id_usuario,
      );
    }

    if (esEstudiante) {
      const matriculas = await this.matriculaRepository.find({
        where: { id_usuario: authUser.id_usuario },
      });

      return todos.filter((m) =>
        matriculas.some(
          (mat) =>
            mat.id_grado === m.asignacion.id_grado &&
            mat.id_seccion === m.asignacion.id_seccion &&
            mat.id_periodo === m.asignacion.id_periodo,
        ),
      );
    }

    return [];
  }

  async findOne(id: number) {
    const material = await this.materialRepository.findOne({
      where: { id_material: id },
      relations: { asignacion: true },
    });
    if (!material) throw new NotFoundException(`Material #${id} no encontrado`);
    return material;
  }

  private async verificarPropietario(id: number, authUser: AuthUser) {
    const material = await this.findOne(id);
    const esAdmin = authUser.roles?.includes('Administrador');
    const esPropietario =
      material.asignacion.id_usuario_docente === authUser.id_usuario;

    if (!esAdmin && !esPropietario) {
      throw new ForbiddenException(
        'No puedes modificar material de otro docente',
      );
    }
    return material;
  }

  async update(
    id: number,
    updateMaterialDto: UpdateMaterialDto,
    authUser: AuthUser,
  ) {
    const material = await this.verificarPropietario(id, authUser);
    Object.assign(material, updateMaterialDto);
    return await this.materialRepository.save(material);
  }

  async remove(id: number, authUser: AuthUser) {
    const material = await this.verificarPropietario(id, authUser);
    await this.materialRepository.remove(material);
    return { message: `Material #${id} eliminado correctamente` };
  }
}
