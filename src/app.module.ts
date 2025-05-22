import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from './common/utils/database';
import config from './config';
import { DatabaseConfig } from './config/database';
import { RedisConfig } from './config/redis';
import { ScrapeModule } from './scrape/scrape.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const { host, password, port } =
          configService.getOrThrow<RedisConfig>('redis');
        return {
          connection: {
            host,
            port,
            password,
          },
        };
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [...config],
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const config = configService.get<DatabaseConfig>(
          'database',
        ) as TypeOrmModuleOptions;
        return {
          ...config,
          namingStrategy: new SnakeNamingStrategy(),
          entities: ['dist/**/*.entity.js'],
          migrations: ['dist/migrations/*{.ts,.js}'],
        };
      },
      inject: [ConfigService],
    }),
    ScrapeModule,
  ],
})
export class AppModule {}
