import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FastifyReply } from 'fastify';

/**
 * Traduit les erreurs Prisma en réponses HTTP lisibles,
 * sans jamais exposer le détail SQL au client.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const reply = host.switchToHttp().getResponse<FastifyReply>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erreur interne';

    switch (exception.code) {
      case 'P2002': {
        statusCode = HttpStatus.CONFLICT;
        const champs = (exception.meta?.target as string[] | undefined)?.join(', ');
        message = champs ? `Valeur déjà utilisée : ${champs}` : 'Cet élément existe déjà';
        break;
      }
      case 'P2025':
        statusCode = HttpStatus.NOT_FOUND;
        message = 'Élément introuvable';
        break;
      case 'P2003':
      case 'P2014':
        statusCode = HttpStatus.CONFLICT;
        message = 'Opération impossible : cet élément est lié à d’autres données';
        break;
      default:
        this.logger.error(`${exception.code} ${exception.message}`);
    }

    void reply.status(statusCode).send({ statusCode, message });
  }
}
