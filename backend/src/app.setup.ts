import helmet from '@fastify/helmet';
import { ValidationPipe } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

/**
 * Configuration commune à l'application et aux tests e2e :
 * préfixe /api, en-têtes de sécurité, validation stricte des entrées, Swagger.
 */
export async function configureApp(app: NestFastifyApplication, options: { swagger?: boolean } = {}) {
  app.setGlobalPrefix('api');

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
        scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
      },
    },
  });

  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (origins.length > 0) {
    app.enableCors({ origin: origins, credentials: false });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // supprime les champs non déclarés dans les DTO
      forbidNonWhitelisted: true, // …et refuse la requête s'il y en a
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.enableShutdownHooks();

  if (options.swagger !== false) {
    const config = new DocumentBuilder()
      .setTitle('ParcForm API')
      .setDescription(
        "Gestion du parc informatique et des salles de formation. " +
          "Authentifiez-vous via POST /api/auth/login puis cliquez sur « Authorize ». " +
          "Les routes /api/agent/* utilisent l'en-tête X-Agent-Token.",
      )
      .setVersion('1.0.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'X-Agent-Token', in: 'header' }, 'agent')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, { jsonDocumentUrl: 'api/docs-json' });
  }
}
