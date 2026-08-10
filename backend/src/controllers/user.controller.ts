import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { sendSuccess } from '../utils/apiResponse';

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user!.id;
    const user = await userService.createUser(req.body, actorId);
    return sendSuccess(res, user, 'User created successfully', 201);
  } catch (error) {
    return next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user!.id;
    const { id } = req.params;
    const user = await userService.updateUser(id, req.body, actorId);
    return sendSuccess(res, user, 'User updated successfully');
  } catch (error) {
    return next(error);
  }
}

export async function getUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await userService.getUsers();
    return sendSuccess(res, users, 'Users retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    return sendSuccess(res, user, 'User retrieved successfully');
  } catch (error) {
    return next(error);
  }
}
