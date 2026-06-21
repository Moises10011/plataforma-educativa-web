import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  async enviarCorreoRecuperacion(correoDestino: string, token: string) {
    const urlRecuperacion = `${this.configService.get<string>('FRONTEND_URL')}/restablecer-contrasena?token=${token}`;
    await this.transporter.sendMail({
      from: `"Plataforma Educativa" <${this.configService.get<string>('MAIL_USER')}>`,
      to: correoDestino,
      subject: 'Recuperacion de contraseña',
      html: `
        <h2>Recuperacion de contraseña</h2>
        <p>Hiciste una solicitud para restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace, valido por 30 minutos:</p>
        <a href="${urlRecuperacion}">${urlRecuperacion}</a>
        <p>Si no solicitaste esto, ignora este correo.</p>
      `,
    });
  }
}
