import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../config/database';
import { UnauthorizedError } from '../utils/apiResponse';
import { UserRole } from '@prisma/client';

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token is missing or invalid');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Access token is missing or invalid');
    }

    const decoded = verifyToken(token);

    // Verify user exists and is active in the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User account is disabled or does not exist');
    }

    (req as any).user = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      name: user.name,
    };

    next();
  } catch (error) {
    next(new UnauthorizedError('Access token is missing or invalid'));
  }
}
