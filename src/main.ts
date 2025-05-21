import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AppConfig } from './config/app';
import { SWAGGER_RELATIVE_URL } from './common/swagger';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { TrimWhitespacePipe } from './common/pipes/trim-whitespace';
import { APP_NAME, APP_VERSION } from './common/constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const { server, swagger, environment } =
    configService.getOrThrow<AppConfig>('app');

  app
    .useGlobalPipes(
      new TrimWhitespacePipe(),
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    )
    .setGlobalPrefix('v1');

  if (swagger.enabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(APP_NAME)
      .setVersion(APP_VERSION)
      .build();

    const swaggerConfigOptions: SwaggerCustomOptions = {
      swaggerOptions: {
        tagsSorter: 'alpha',
        operationsSorter: 'method',
        persistAuthorization: true,
        docExpansion: 'none',
        onComplete: () => ((document as any).title = 'RMS'),
      },
    };

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(
      SWAGGER_RELATIVE_URL,
      app,
      document,
      swaggerConfigOptions,
    );
  }

  await app.listen(server.port);

  // TODO: Replace with logger
  const appUrl = `${environment === 'development' ? 'http://localhost:' : ''}${
    server.port
  }`;

  console.log('Server running on:', appUrl);

  swagger.enabled &&
    console.log('Swagger doc:', appUrl + '/' + SWAGGER_RELATIVE_URL);
}

void bootstrap();
