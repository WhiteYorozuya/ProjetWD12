import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit: 2 * 1024 * 1024, trustProxy: true }),
  );

  await configureApp(app);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`API démarrée sur le port ${port} — documentation : /api/docs`, 'Bootstrap');
}

void bootstrap();
