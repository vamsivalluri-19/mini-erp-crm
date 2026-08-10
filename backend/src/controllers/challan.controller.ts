import { Request, Response, NextFunction } from 'express';
import * as challanService from '../services/challan.service';
import { sendSuccess, sendListSuccess } from '../utils/apiResponse';
import { getPaginationParams, getPaginationMeta } from '../utils/pagination';
import { ChallanStatus } from '@prisma/client';

export async function createChallan(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user!.id;
    const challan = await challanService.createChallan(req.body, actorId);
    return sendSuccess(res, challan, 'Challan created successfully', 201);
  } catch (error) {
    return next(error);
  }
}

export async function updateChallan(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user!.id;
    const { id } = req.params;
    const challan = await challanService.updateChallan(id, req.body, actorId);
    return sendSuccess(res, challan, 'Challan updated successfully');
  } catch (error) {
    return next(error);
  }
}

export async function confirmChallan(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user!.id;
    const { id } = req.params;
    const challan = await challanService.confirmChallan(id, actorId);
    return sendSuccess(res, challan, 'Challan confirmed successfully');
  } catch (error) {
    return next(error);
  }
}

export async function cancelChallan(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user!.id;
    const { id } = req.params;
    const challan = await challanService.cancelChallan(id, actorId);
    return sendSuccess(res, challan, 'Challan cancelled successfully');
  } catch (error) {
    return next(error);
  }
}

export async function getChallanById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const challan = await challanService.getChallanById(id);
    return sendSuccess(res, challan, 'Challan retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

export async function getChallans(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = getPaginationParams(req.query.page, req.query.limit);
    const { search, customerId, status, startDate, endDate } = req.query;

    const parsedStartDate = startDate ? new Date(startDate as string) : undefined;
    const parsedEndDate = endDate ? new Date(endDate as string) : undefined;

    // Validate dates if provided
    if (parsedStartDate && isNaN(parsedStartDate.getTime())) {
      throw new Error('Invalid start date format');
    }
    if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
      throw new Error('Invalid end date format');
    }

    const { total, challans } = await challanService.queryChallans({
      search: search as string,
      customerId: customerId as string,
      status: status as ChallanStatus,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      page,
      limit,
      skip,
    });

    const meta = getPaginationMeta(total, page, limit);
    return sendListSuccess(res, challans, meta, 'Challans retrieved successfully');
  } catch (error) {
    return next(error);
  }
}
