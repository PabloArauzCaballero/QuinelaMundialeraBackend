import { HttpStatus } from '@nestjs/common';
import type { ErrorCode } from './error-code.enum';
import { ErrorCode as Codes } from './error-code.enum';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode = HttpStatus.BAD_REQUEST,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

export const badRequest = (code: ErrorCode, message: string, details?: unknown): AppError =>
  new AppError(code, message, HttpStatus.BAD_REQUEST, details);

export const unauthorized = (message = 'No autenticado.'): AppError =>
  new AppError(Codes.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED);

export const forbidden = (message = 'No autorizado.'): AppError =>
  new AppError(Codes.FORBIDDEN, message, HttpStatus.FORBIDDEN);

export const notFound = (message = 'Recurso no encontrado.'): AppError =>
  new AppError(Codes.NOT_FOUND, message, HttpStatus.NOT_FOUND);

export const conflict = (message: string): AppError =>
  new AppError(Codes.CONFLICT, message, HttpStatus.CONFLICT);
