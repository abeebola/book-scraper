import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from './common/utils/database';
import config from './config';
import { DatabaseConfig } from './config/database';
import { ScrapeModule } from './scrape/scrape.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
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
