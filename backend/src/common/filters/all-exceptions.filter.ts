import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Error interno del servidor';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const respuesta = exception.getResponse();

      if (typeof respuesta === 'string') {
        message = respuesta;
        error = exception.name;
      } else if (typeof respuesta === 'object' && respuesta !== null) {
        const objeto = respuesta as {
          message?: string | string[];
          error?: string;
        };
        message = objeto.message ?? exception.message;
        error = objeto.error ?? exception.name;
      }
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      error = 'Database Error';

      const driverError = exception as QueryFailedError & { code?: string };

      if (driverError.code === 'ER_DUP_ENTRY') {
        message =
          'Ya existe un registro con ese valor unico (ejemplo: correo duplicado)';
      } else if (
        driverError.code === 'ER_NO_REFERENCED_ROW_2' ||
        driverError.code === 'ER_NO_REFERENCED_ROW'
      ) {
        message =
          'El registro relacionado no existe (verifica los ids enviados)';
      } else if (
        driverError.code === 'ER_ROW_IS_REFERENCED_2' ||
        driverError.code === 'ER_ROW_IS_REFERENCED'
      ) {
        message =
          'No se puede eliminar este registro porque tiene datos relacionados';
      } else {
        message = 'Error en la base de datos';
      }

      // Log temporal de diagnóstico: detalle real del error SQL
      this.logger.error(
        `SQL real -> code: ${driverError.code} | message: ${driverError.message}`,
      );
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${JSON.stringify(message)}`,
    );

    response.status(status).json({
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
