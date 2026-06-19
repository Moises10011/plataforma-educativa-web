import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Usuario } from '../usuario/entities/usuario.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const usuario = await this.usuarioRepository.findOne({
      where: { correo: loginDto.correo },
      relations: { roles: true },
    });

    if (!usuario) throw new UnauthorizedException('Credenciales incorrectas');

    const passwordValido = await bcrypt.compare(
      loginDto.password,
      usuario.password,
    );
    if (!passwordValido)
      throw new UnauthorizedException('Credenciales incorrectas');

    const nombresRoles = usuario.roles.map((rol) => rol.nombre_rol);

    const payload = {
      sub: usuario.id_usuario,
      correo: usuario.correo,
      roles: nombresRoles,
    };

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id_usuario: usuario.id_usuario,
        nombres: usuario.nombres,
        correo: usuario.correo,
        roles: nombresRoles,
      },
    };
  }
}
