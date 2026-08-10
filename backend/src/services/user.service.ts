import { prisma } from '../config/database';
import { hashPassword } from '../utils/password';
import { CreateUserInput, UpdateUserInput } from '../validators/user.validator';
import { ConflictError, NotFoundError } from '../utils/apiResponse';

export async function createUser(input: CreateUserInput, actorId: string) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new ConflictError('Email already in use');
  }

  const hashedPassword = await hashPassword(input.password);

  const newUser = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
      role: input.role,
      isActive: input.isActive ?? true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  // Log action
  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action: 'CREATE',
      entity: 'User',
      entityId: newUser.id,
      newValue: JSON.stringify({ name: newUser.name, email: newUser.email, role: newUser.role }),
    },
  });

  return newUser;
}

export async function updateUser(id: string, input: UpdateUserInput, actorId: string) {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (input.email && input.email !== user.email) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictError('Email already in use');
    }
  }

  const updateData: Record<string, any> = { ...input };
  if (input.password) {
    updateData.password = await hashPassword(input.password);
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Log action
  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action: 'UPDATE',
      entity: 'User',
      entityId: user.id,
      oldValue: JSON.stringify({ name: user.name, email: user.email, role: user.role, isActive: user.isActive }),
      newValue: JSON.stringify({ name: updatedUser.name, email: updatedUser.email, role: updatedUser.role, isActive: updatedUser.isActive }),
    },
  });

  return updatedUser;
}

export async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}
