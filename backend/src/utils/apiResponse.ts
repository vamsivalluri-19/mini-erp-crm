import { Response } from 'express';

export interface ApiResponseOptions<T> {
  res: Response;
  statusCode: number;
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function sendResponse<T>({
  res,
  statusCode,
  success,
  message,
  data,
  pagination,
}: ApiResponseOptions<T>) {
  const responsePayload: Record<string, unknown> = {
    success,
  };

  if (message !== undefined) {
    responsePayload.message = message;
  }

  if (data !== undefined) {
    responsePayload.data = data;
  }

  if (pagination !== undefined) {
    responsePayload.pagination = pagination;
  }

  return res.status(statusCode).json(responsePayload);
}

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode = 200) {
  return sendResponse({
    res,
    statusCode,
    success: true,
    message,
    data,
  });
}

export function sendListSuccess<T>(
  res: Response,
  data: T[],
  pagination: { page: number; limit: number; total: number; totalPages: number },
  message?: string,
  statusCode = 200
) {
  return sendResponse({
    res,
    statusCode,
    success: true,
    message,
    data,
    pagination,
  });
}

export function sendError(res: Response, message: string, statusCode = 500, errors?: unknown) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: errors !== undefined ? errors : undefined,
  });
}
export class AppError extends Error {
  public statusCode: number;
  public errors?: unknown;

  constructor(message: string, statusCode = 500, errors?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', errors?: unknown) {
    super(message, 400, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}
