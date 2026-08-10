import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/apiResponse';
import { UserRole } from '@prisma/client';

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const reqAny = req as any;
    if (!reqAny.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(reqAny.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }

    next();
  };
}
