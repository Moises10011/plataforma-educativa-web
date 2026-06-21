import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { Usuario } from '../usuario/entities/usuario.entity';
import { PasswordReset } from '../password-reset/entities/password-reset.entity';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepository: Repository<PasswordReset>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
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

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const usuario = await this.usuarioRepository.findOneBy({
      correo: forgotPasswordDto.correo,
    });

    if (!usuario) {
      return {
        message: 'Si el correo existe, se enviara un enlace de recuperacion',
      };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const fechaExpiracion = new Date();
    fechaExpiracion.setMinutes(fechaExpiracion.getMinutes() + 30);

    const passwordReset = this.passwordResetRepository.create({
      id_usuario: usuario.id_usuario,
      token,
      fecha_expiracion: fechaExpiracion,
    });

    await this.passwordResetRepository.save(passwordReset);

    await this.mailService.enviarCorreoRecuperacion(usuario.correo, token);

    return {
      message: 'Si el correo existe, se enviara un enlace de recuperacion',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const passwordReset = await this.passwordResetRepository.findOne({
      where: {
        token: resetPasswordDto.token,
        usado: false,
        fecha_expiracion: MoreThan(new Date()),
      },
    });

    if (!passwordReset) {
      throw new BadRequestException('El token es invalido o ha expirado');
    }

    const usuario = await this.usuarioRepository.findOneBy({
      id_usuario: passwordReset.id_usuario,
    });

    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }

    usuario.password = await bcrypt.hash(resetPasswordDto.password, 10);
    await this.usuarioRepository.save(usuario);

    passwordReset.usado = true;
    await this.passwordResetRepository.save(passwordReset);

    return { message: 'Contraseña actualizada correctamente' };
  }
}
