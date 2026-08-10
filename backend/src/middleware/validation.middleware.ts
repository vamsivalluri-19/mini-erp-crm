import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

export function validateBody(schema: ZodType<any, any, any>) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateQuery(schema: ZodType<any, any, any>) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateParams(schema: ZodType<any, any, any>) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      next(error);
    }
  };
}
