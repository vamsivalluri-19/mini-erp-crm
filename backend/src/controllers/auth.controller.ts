import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body);
    return sendSuccess(res, result, 'Login successful');
  } catch (error) {
    return next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const reqAny = req as any;
    if (!reqAny.user) {
      return sendError(res, 'Unauthenticated', 401);
    }
    const profile = await authService.getUserProfile(reqAny.user.id);
    return sendSuccess(res, profile, 'User profile retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

export async function logout(_req: Request, res: Response, next: NextFunction) {
  try {
    // Stateles JWT logout: Client should destroy the token.
    // We can respond with a success response.
    return sendSuccess(res, {}, 'Logout successful');
  } catch (error) {
    return next(error);
  }
}
