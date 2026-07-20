import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Usuario } from '../usuario/entities/usuario.entity';
import { PasswordReset } from '../password-reset/entities/password-reset.entity';
import { Matricula } from '../matricula/entities/matricula.entity';
import { AsignacionCurso } from '../asignacion-curso/entities/asignacion-curso.entity';
import { PeriodoAcademico } from '../periodo-academico/entities/periodo-academico.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailService } from './mail.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      PasswordReset,
      Matricula,
      AsignacionCurso,
      PeriodoAcademico,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, MailService],
  exports: [JwtModule],
})
export class AuthModule {}
