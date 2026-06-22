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
    // 1. Buscar usuario por correo incluyendo roles
    const usuario = await this.usuarioRepository.findOne({
      where: { correo: loginDto.correo },
      relations: { roles: true },
    });

    // 2. Si no existe, mismo mensaje que contraseña incorrecta (evita enumeración de usuarios)
    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // 3. Verificar que la cuenta esté activa
    if (!usuario.estado) {
      throw new UnauthorizedException('La cuenta está desactivada');
    }

    // 4. Verificar contraseña
    const passwordValido = await bcrypt.compare(
      loginDto.password,
      usuario.password,
    );
    if (!passwordValido) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // 5. Verificar que tenga al menos un rol asignado
    if (!usuario.roles || usuario.roles.length === 0) {
      throw new UnauthorizedException('El usuario no tiene roles asignados');
    }

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
        apellidos: usuario.apellidos,
        correo: usuario.correo,
        roles: nombresRoles,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const usuario = await this.usuarioRepository.findOneBy({
      correo: forgotPasswordDto.correo,
    });

    // Respuesta genérica para evitar enumeración de correos
    const respuestaGenerica = {
      message: 'Si el correo existe, se enviará un enlace de recuperación',
    };

    if (!usuario) return respuestaGenerica;
    if (!usuario.estado) return respuestaGenerica;

    // Invalidar tokens anteriores del mismo usuario
    await this.passwordResetRepository.update(
      { id_usuario: usuario.id_usuario, usado: false },
      { usado: true },
    );

    const token = crypto.randomBytes(32).toString('hex');
    const fechaExpiracion = new Date();
    fechaExpiracion.setMinutes(fechaExpiracion.getMinutes() + 30);

    const passwordReset = this.passwordResetRepository.create({
      id_usuario: usuario.id_usuario,
      token,
      fecha_expiracion: fechaExpiracion,
      usado: false,
    });

    await this.passwordResetRepository.save(passwordReset);
    await this.mailService.enviarCorreoRecuperacion(usuario.correo, token);

    return respuestaGenerica;
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
      throw new BadRequestException('El token es inválido o ha expirado');
    }

    const usuario = await this.usuarioRepository.findOneBy({
      id_usuario: passwordReset.id_usuario,
    });

    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Actualizar contraseña
    usuario.password = await bcrypt.hash(resetPasswordDto.password, 10);
    await this.usuarioRepository.save(usuario);

    // Marcar token como usado
    passwordReset.usado = true;
    await this.passwordResetRepository.save(passwordReset);

    return { message: 'Contraseña actualizada correctamente' };
  }

  /**
   * Valida el JWT y retorna el payload.
   * Usado por JwtStrategy para poblar req.user.
   */
  async validateJwtPayload(payload: {
    sub: number;
    correo: string;
    roles: string[];
  }) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id_usuario: payload.sub, estado: true },
    });

    if (!usuario) {
      throw new UnauthorizedException('Token inválido o usuario inactivo');
    }

    return {
      id_usuario: payload.sub,
      correo: payload.correo,
      roles: payload.roles,
    };
  }
}
