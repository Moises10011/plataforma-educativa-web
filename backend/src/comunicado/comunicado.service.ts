import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Comunicado } from './entities/comunicado.entity';
import { CreateComunicadoDto } from './dto/create-comunicado.dto';
import { UpdateComunicadoDto } from './dto/update-comunicado.dto';

interface AuthUser {
  id_usuario: number;
  roles?: string[];
}

@Injectable()
export class ComunicadoService {
  constructor(
    @InjectRepository(Comunicado)
    private readonly comunicadoRepository: Repository<Comunicado>,
  ) {}

  async create(createComunicadoDto: CreateComunicadoDto, authUser: AuthUser) {
    const comunicado = this.comunicadoRepository.create({
      ...createComunicadoDto,
      id_usuario_admin: authUser.id_usuario,
    });
    return await this.comunicadoRepository.save(comunicado);
  }

  findAll() {
    return this.comunicadoRepository.find({ relations: { admin: true } });
  }

  async findOne(id: number) {
    const comunicado = await this.comunicadoRepository.findOne({
      where: { id_comunicado: id },
      relations: { admin: true },
    });
    if (!comunicado)
      throw new NotFoundException(`Comunicado #${id} no encontrado`);
    return comunicado;
  }

  async update(
    id: number,
    updateComunicadoDto: UpdateComunicadoDto,
    authUser: AuthUser,
  ) {
    const comunicado = await this.findOne(id);
    const esAdmin = authUser.roles?.includes('Administrador');
    const esPropietario = comunicado.id_usuario_admin === authUser.id_usuario;

    if (!esAdmin && !esPropietario) {
      throw new ForbiddenException(
        'No puedes modificar un comunicado de otra persona',
      );
    }

    Object.assign(comunicado, updateComunicadoDto);
    return await this.comunicadoRepository.save(comunicado);
  }

  async remove(id: number) {
    const comunicado = await this.findOne(id);
    await this.comunicadoRepository.remove(comunicado);
    return { message: `Comunicado #${id} eliminado correctamente` };
  }
}
