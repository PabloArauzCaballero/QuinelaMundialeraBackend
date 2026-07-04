import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Quiniela Mundial 2026 API')
    .setDescription('API REST para grupos privados, pronósticos, partidos, ranking y sincronización de resultados.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Quiniela Mundial 2026 API Docs',
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #0f172a; font-weight: 800; }
      .swagger-ui .opblock-tag { font-size: 18px; }
    `
  });
}
