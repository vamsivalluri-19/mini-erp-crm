import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { sendSuccess } from '../utils/apiResponse';

export async function getStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await dashboardService.getDashboardStats();
    return sendSuccess(res, stats, 'Dashboard stats retrieved successfully');
  } catch (error) {
    return next(error);
  }
}
