import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ForeignKeyConstraintError, UniqueConstraintError, ValidationError as SequelizeValidationError } from 'sequelize';
import { AppError } from '../errors/app-error';
import { ErrorCode } from '../errors/error-code.enum';

type RequestWithId = Request & { requestId?: string };

interface ErrorPayload {
  requestId: string;
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();

    const payload = this.toPayload(exception, request.requestId);
    
    // Loguear el error en la consola del servidor para poder diagnosticarlo
    if (payload.statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error(`[Unhandled Exception] RequestID: ${payload.requestId}`, exception);
    }

    response.status(payload.statusCode).json({
      requestId: payload.requestId,
      error: {
        code: payload.code,
        message: payload.message,
        details: payload.details
      },
      timestamp: new Date().toISOString()
    });
  }

  private toPayload(exception: unknown, requestId = 'unknown'): ErrorPayload {
    if (exception instanceof AppError) {
      return {
        requestId,
        statusCode: exception.statusCode,
        code: exception.code,
        message: exception.message,
        details: exception.details
      };
    }

    if (exception instanceof UniqueConstraintError) {
      return {
        requestId,
        statusCode: HttpStatus.CONFLICT,
        code: ErrorCode.UNIQUE_CONSTRAINT,
        message: 'El recurso ya existe o incumple una restricción única.',
        details: this.safeSequelizeDetails(exception)
      };
    }

    if (exception instanceof ForeignKeyConstraintError) {
      return {
        requestId,
        statusCode: HttpStatus.BAD_REQUEST,
        code: ErrorCode.FOREIGN_KEY_CONSTRAINT,
        message: 'La solicitud referencia un recurso inexistente o no válido.',
        details: this.safeForeignKeyDetails(exception)
      };
    }

    if (exception instanceof SequelizeValidationError) {
      return {
        requestId,
        statusCode: HttpStatus.BAD_REQUEST,
        code: ErrorCode.VALIDATION_ERROR,
        message: 'La información enviada no cumple las reglas de persistencia.',
        details: this.safeSequelizeDetails(exception)
      };
    }

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      const message = typeof exceptionResponse === 'string' ? exceptionResponse : (exceptionResponse as { message?: string | string[] }).message;
      return {
        requestId,
        statusCode: exception.getStatus(),
        code: ErrorCode.VALIDATION_ERROR,
        message: Array.isArray(message) ? message.join('; ') : message ?? exception.message,
        details: undefined
      };
    }

    return {
      requestId,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Error interno no controlado.',
      details: undefined
    };
  }

  private safeSequelizeDetails(exception: SequelizeValidationError): Array<{ path?: string; message: string }> {
    const fromErrors = exception.errors?.map((error) => ({ path: error.path ?? undefined, message: error.message })) ?? [];
    if (fromErrors.length > 0) return fromErrors;
    return [{ path: undefined, message: exception.message }];
  }

  private safeForeignKeyDetails(exception: ForeignKeyConstraintError): { table?: string; fields?: string[] } {
    return {
      table: typeof exception.table === 'string' ? exception.table : undefined,
      fields: Array.isArray(exception.fields) ? exception.fields.map(String) : undefined
    };
  }
}
