import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleAsyncOptions = {
  inject: [ConfigService],

  useFactory: (configService: ConfigService) => ({
    type: 'mysql',

    host: configService.get<string>('DB_HOST'),

    port: Number(configService.get<number>('DB_PORT')),

    username: configService.get<string>('DB_USER'),

    password: configService.get<string>('DB_PASSWORD'),

    database: configService.get<string>('DB_NAME'),

    autoLoadEntities: true,

    synchronize: false,
  }),
};
