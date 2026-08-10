import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/apiResponse';

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  void next;
  console.error(`[ERROR] ${req.method} ${req.url}:`, err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || undefined,
    });
  }

  if (err instanceof ZodError) {
    const formattedErrors: Record<string, string> = {};
    err.errors.forEach((e) => {
      const field = e.path.join('.');
      formattedErrors[field] = e.message;
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }

  // Handle default server errors
  const isProduction = process.env.NODE_ENV === 'production';
  return res.status(500).json({
    success: false,
    message: isProduction ? 'Internal Server Error' : err.message,
    ...(!isProduction && { stack: err.stack }),
  });
}
