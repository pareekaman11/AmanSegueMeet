import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  /**
   * CORS — permissive in development.
   * Restrict origins in production by setting the CORS_ORIGIN environment variable.
   */
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  /**
   * Global ValidationPipe — applied to every controller.
   * - whitelist: strips properties not present in the DTO class.
   * - forbidNonWhitelisted: throws 400 if unknown properties are sent.
   * - transform: automatically converts plain JSON payloads into DTO class instances.
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  /**
   * Swagger OpenAPI setup
   */
  const config = new DocumentBuilder()
    .setTitle('SegueMeet API')
    .setDescription('API documentation for the SegueMeet Board Management Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port, '0.0.0.0');
  Logger.log(
    `SegueMeet API listening on http://0.0.0.0:${port}`,
    'Bootstrap',
  );
}
bootstrap();
