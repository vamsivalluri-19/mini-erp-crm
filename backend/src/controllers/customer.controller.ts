import { Request, Response, NextFunction } from 'express';
import * as customerService from '../services/customer.service';
import { sendSuccess, sendListSuccess } from '../utils/apiResponse';
import { getPaginationParams, getPaginationMeta } from '../utils/pagination';

export async function createCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user!.id;
    const customer = await customerService.createCustomer(req.body, actorId);
    return sendSuccess(res, customer, 'Customer created successfully', 201);
  } catch (error) {
    return next(error);
  }
}

export async function updateCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user!.id;
    const { id } = req.params;
    const customer = await customerService.updateCustomer(id, req.body, actorId);
    return sendSuccess(res, customer, 'Customer updated successfully');
  } catch (error) {
    return next(error);
  }
}

export async function deleteCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user!.id;
    const { id } = req.params;
    await customerService.deleteCustomer(id, actorId);
    return sendSuccess(res, { id }, 'Customer deleted successfully');
  } catch (error) {
    return next(error);
  }
}

export async function getCustomerById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const customer = await customerService.getCustomerById(id);
    return sendSuccess(res, customer, 'Customer retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

export async function getCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = getPaginationParams(req.query.page, req.query.limit);
    const { search, status, customerType } = req.query;

    const { total, customers } = await customerService.queryCustomers({
      search: search as string,
      status: status as string,
      customerType: customerType as string,
      page,
      limit,
      skip,
    });

    const meta = getPaginationMeta(total, page, limit);
    return sendListSuccess(res, customers, meta, 'Customers retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

// CRM FOLLOW UP CONTROLLERS

export async function addFollowUp(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user!.id;
    const { id } = req.params; // Customer ID
    const followUp = await customerService.addFollowUp(id, req.body, actorId);
    return sendSuccess(res, followUp, 'Follow-up log added successfully', 201);
  } catch (error) {
    return next(error);
  }
}

export async function updateFollowUp(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user!.id;
    const { id, followUpId } = req.params;
    const followUp = await customerService.updateFollowUp(id, followUpId, req.body, actorId);
    return sendSuccess(res, followUp, 'Follow-up log updated successfully');
  } catch (error) {
    return next(error);
  }
}

export async function deleteFollowUp(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user!.id;
    const { id, followUpId } = req.params;
    await customerService.deleteFollowUp(id, followUpId, actorId);
    return sendSuccess(res, { id: followUpId }, 'Follow-up log deleted successfully');
  } catch (error) {
    return next(error);
  }
}

export async function getFollowUps(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const customer = await customerService.getCustomerById(id);
    return sendSuccess(res, customer.followUps, 'Follow-ups retrieved successfully');
  } catch (error) {
    return next(error);
  }
}
