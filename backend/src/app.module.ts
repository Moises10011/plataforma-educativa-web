import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { databaseConfig } from './config/database.config';
import { UsuarioModule } from './usuario/usuario.module';
import { RolModule } from './rol/rol.module';
import { UsuarioRolModule } from './usuario-rol/usuario-rol.module';
import { PeriodoAcademicoModule } from './periodo-academico/periodo-academico.module';
import { GradoModule } from './grado/grado.module';
import { SeccionModule } from './seccion/seccion.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync(databaseConfig),

    UsuarioModule,

    RolModule,

    UsuarioRolModule,

    PeriodoAcademicoModule,

    GradoModule,

    SeccionModule,
  ],
})
export class AppModule {}
