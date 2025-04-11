import { NestFactory } from '@nestjs/core';
global.crypto = require('crypto');

import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:4200'], // 👈 Allow Angular frontend only
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips properties not in the DTO
      forbidNonWhitelisted: true,
      transform: true, // enables auto-transform from plain to class
    }),
  );

  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
