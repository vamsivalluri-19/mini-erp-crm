import { Request, Response, NextFunction } from 'express';
import * as productService from '../services/product.service';
import { sendSuccess, sendListSuccess } from '../utils/apiResponse';
import { getPaginationParams, getPaginationMeta } from '../utils/pagination';

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user!.id;
    const product = await productService.createProduct(req.body, actorId);
    return sendSuccess(res, product, 'Product created successfully', 201);
  } catch (error) {
    return next(error);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user!.id;
    const { id } = req.params;
    const product = await productService.updateProduct(id, req.body, actorId);
    return sendSuccess(res, product, 'Product updated successfully');
  } catch (error) {
    return next(error);
  }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user!.id;
    const { id } = req.params;
    await productService.deleteProduct(id, actorId);
    return sendSuccess(res, { id }, 'Product deleted successfully');
  } catch (error) {
    return next(error);
  }
}

export async function getProductById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    return sendSuccess(res, product, 'Product retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

export async function getProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = getPaginationParams(req.query.page, req.query.limit);
    const { search, category, lowStock, warehouseLocation } = req.query;

    const { total, products } = await productService.queryProducts({
      search: search as string,
      category: category as string,
      lowStock: lowStock === 'true',
      warehouseLocation: warehouseLocation as string,
      page,
      limit,
      skip,
    });

    const meta = getPaginationMeta(total, page, limit);
    return sendListSuccess(res, products, meta, 'Products retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

export async function getCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await productService.getProductCategories();
    return sendSuccess(res, categories, 'Categories retrieved successfully');
  } catch (error) {
    return next(error);
  }
}
