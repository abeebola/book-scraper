import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SnakeNamingStrategy } from './common/utils/database';
import config from './config';
import { DatabaseConfig } from './config/database';
import { ScrapeModule } from './scrape/scrape.module';

@Module({
  imports: [
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
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
