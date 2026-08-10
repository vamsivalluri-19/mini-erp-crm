import { prisma } from '../config/database';
import { StockAdjustmentInput } from '../validators/product.validator';
import { ConflictError, NotFoundError } from '../utils/apiResponse';

export async function adjustStock(input: StockAdjustmentInput, actorId: string) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: input.productId },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (input.movementType === 'IN') {
      const updatedProduct = await tx.product.update({
        where: { id: input.productId },
        data: {
          currentStock: {
            increment: input.quantity,
          },
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId: input.productId,
          quantity: input.quantity,
          movementType: 'IN',
          reason: input.reason,
          createdBy: actorId,
        },
      });

      return {
        product: updatedProduct,
        movement,
      };
    } else {
      // OUT movement
      if (product.currentStock < input.quantity) {
        throw new ConflictError(
          `Insufficient stock for product '${product.productName}'. Requested: ${input.quantity}, Available: ${product.currentStock}`
        );
      }

      const updatedProduct = await tx.product.update({
        where: { id: input.productId },
        data: {
          currentStock: {
            decrement: input.quantity,
          },
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId: input.productId,
          quantity: input.quantity,
          movementType: 'OUT',
          reason: input.reason,
          createdBy: actorId,
        },
      });

      return {
        product: updatedProduct,
        movement,
      };
    }
  });
}

export async function getStockMovements(params: {
  productId?: string;
  movementType?: 'IN' | 'OUT';
  page: number;
  limit: number;
  skip: number;
}) {
  const where: Record<string, any> = {};

  if (params.productId) {
    where.productId = params.productId;
  }
  if (params.movementType) {
    where.movementType = params.movementType;
  }

  const [total, movements] = await Promise.all([
    prisma.stockMovement.count({ where }),
    prisma.stockMovement.findMany({
      where,
      skip: params.skip,
      take: params.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { id: true, productName: true, sku: true, category: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
  ]);

  return {
    total,
    movements,
  };
}

export async function getStockMovementsByProduct(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  return prisma.stockMovement.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    include: {
      creator: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}
