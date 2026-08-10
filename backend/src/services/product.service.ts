import { prisma } from '../config/database';
import { CreateProductInput, UpdateProductInput } from '../validators/product.validator';
import { ConflictError, NotFoundError } from '../utils/apiResponse';
import { Prisma } from '@prisma/client';

export async function createProduct(input: CreateProductInput, actorId: string) {
  const existingProduct = await prisma.product.findUnique({
    where: { sku: input.sku },
  });

  if (existingProduct) {
    throw new ConflictError(`Product SKU '${input.sku}' already exists`);
  }

  const product = await prisma.product.create({
    data: {
      productName: input.productName,
      sku: input.sku,
      category: input.category,
      unitPrice: input.unitPrice,
      currentStock: input.currentStock ?? 0,
      minimumStock: input.minimumStock ?? 0,
      warehouseLocation: input.warehouseLocation || null,
    },
  });

  // Log opening stock if currentStock > 0
  if (product.currentStock > 0) {
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        quantity: product.currentStock,
        movementType: 'IN',
        reason: 'Opening Stock',
        createdBy: actorId,
      },
    });
  }

  // Log audit
  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action: 'CREATE',
      entity: 'Product',
      entityId: product.id,
      newValue: JSON.stringify(product),
    },
  });

  return product;
}

export async function updateProduct(id: string, input: UpdateProductInput, actorId: string) {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  if (input.sku && input.sku !== product.sku) {
    const existing = await prisma.product.findUnique({
      where: { sku: input.sku },
    });
    if (existing) {
      throw new ConflictError(`Product SKU '${input.sku}' already exists`);
    }
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      productName: input.productName,
      sku: input.sku,
      category: input.category,
      unitPrice: input.unitPrice,
      minimumStock: input.minimumStock,
      warehouseLocation: input.warehouseLocation,
    },
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action: 'UPDATE',
      entity: 'Product',
      entityId: product.id,
      oldValue: JSON.stringify(product),
      newValue: JSON.stringify(updated),
    },
  });

  return updated;
}

export async function deleteProduct(id: string, actorId: string) {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Check historical transactions in ChallanItem or StockMovement
  const [challanItemCount, movementCount] = await Promise.all([
    prisma.challanItem.count({ where: { productId: id } }),
    prisma.stockMovement.count({ where: { productId: id } }),
  ]);

  if (challanItemCount > 0 || movementCount > 0) {
    throw new ConflictError('Cannot delete product with historical transactional records');
  }

  await prisma.product.delete({
    where: { id },
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action: 'DELETE',
      entity: 'Product',
      entityId: id,
      oldValue: JSON.stringify(product),
    },
  });

  return { id };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  return product;
}

export async function queryProducts(params: {
  search?: string;
  category?: string;
  lowStock?: boolean;
  warehouseLocation?: string;
  page: number;
  limit: number;
  skip: number;
}) {
  const where: Prisma.ProductWhereInput = {};

  if (params.search) {
    where.OR = [
      { productName: { contains: params.search, mode: 'insensitive' } },
      { sku: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  if (params.category) {
    where.category = { equals: params.category, mode: 'insensitive' };
  }

  if (params.warehouseLocation) {
    where.warehouseLocation = { contains: params.warehouseLocation, mode: 'insensitive' };
  }

  if (params.lowStock) {
    where.currentStock = {
      lte: prisma.product.fields.minimumStock, // currentStock <= minimumStock
    };
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip: params.skip,
      take: params.limit,
      orderBy: { productName: 'asc' },
    }),
  ]);

  return {
    total,
    products,
  };
}

export async function getProductCategories() {
  const categories = await prisma.product.findMany({
    select: { category: true },
    distinct: ['category'],
  });
  return categories.map((c) => c.category);
}
