import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { setupSwagger } from './docs/swagger.setup';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get('APP_CONFIG');

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: config.corsOrigins,
    credentials: true
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  setupSwagger(app);

  await app.listen(config.port);
}

void bootstrap();
