import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UsuarioRol } from './entities/usuario-rol.entity';
import { CreateUsuarioRolDto } from './dto/create-usuario-rol.dto';

@Injectable()
export class UsuarioRolService {
  constructor(
    @InjectRepository(UsuarioRol)
    private readonly usuarioRolRepository: Repository<UsuarioRol>,
  ) {}

  async asignar(createUsuarioRolDto: CreateUsuarioRolDto) {
    const usuarioRol = this.usuarioRolRepository.create(createUsuarioRolDto);
    return await this.usuarioRolRepository.save(usuarioRol);
  }

  async findRolesByUsuario(id_usuario: number) {
    return await this.usuarioRolRepository.find({
      where: { id_usuario },
      relations: {
        rol: true,
      },
    });
  }

  async remove(id_usuario: number, id_rol: number) {
    const usuarioRol = await this.usuarioRolRepository.findOne({
      where: { id_usuario, id_rol },
    });
    if (!usuarioRol) throw new NotFoundException(`Asignacion no encontrada`);
    await this.usuarioRolRepository.remove(usuarioRol);
    return { message: `Rol quitado correctamente al usuario` };
  }
}
