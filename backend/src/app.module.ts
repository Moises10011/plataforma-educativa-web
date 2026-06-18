import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { databaseConfig } from './config/database.config';
import { UsuarioModule } from './usuario/usuario.module';
import { RolModule } from './rol/rol.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync(databaseConfig),

    UsuarioModule,

    RolModule,
  ],
})
export class AppModule {}
