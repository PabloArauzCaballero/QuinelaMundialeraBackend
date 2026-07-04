import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
import type { ZodTypeAny } from 'zod';
import { badRequest } from '../errors/app-error';
import { ErrorCode } from '../errors/error-code.enum';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodTypeAny) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw badRequest(
        ErrorCode.VALIDATION_ERROR,
        'La información enviada no es válida.',
        result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
      );
    }
    return result.data;
  }
}
