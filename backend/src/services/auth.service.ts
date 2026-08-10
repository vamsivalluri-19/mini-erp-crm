import { prisma } from '../config/database';
import { comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { LoginInput } from '../validators/auth.validator';
import { UnauthorizedError } from '../utils/apiResponse';

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || !user.isActive) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isPasswordValid = await comparePassword(input.password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Log action
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
    },
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  if (!user || !user.isActive) {
    throw new UnauthorizedError('User profile not found or disabled');
  }

  return user;
}
