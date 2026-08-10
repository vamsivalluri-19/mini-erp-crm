import { Request, Response, NextFunction } from 'express';
import * as stockService from '../services/stock.service';
import { sendSuccess, sendListSuccess } from '../utils/apiResponse';
import { getPaginationParams, getPaginationMeta } from '../utils/pagination';

export async function adjustStock(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user!.id;
    const result = await stockService.adjustStock(req.body, actorId);
    return sendSuccess(res, result, 'Stock adjusted successfully', 201);
  } catch (error) {
    return next(error);
  }
}

export async function getMovements(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = getPaginationParams(req.query.page, req.query.limit);
    const { productId, movementType } = req.query;

    const { total, movements } = await stockService.getStockMovements({
      productId: productId as string,
      movementType: movementType as 'IN' | 'OUT',
      page,
      limit,
      skip,
    });

    const meta = getPaginationMeta(total, page, limit);
    return sendListSuccess(res, movements, meta, 'Stock movements ledger retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

export async function getProductMovements(req: Request, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;
    const movements = await stockService.getStockMovementsByProduct(productId);
    return sendSuccess(res, movements, 'Stock movements retrieved for product');
  } catch (error) {
    return next(error);
  }
}
