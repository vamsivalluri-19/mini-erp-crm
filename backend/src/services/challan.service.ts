import { prisma } from '../config/database';
import { CreateChallanInput, UpdateChallanInput } from '../validators/challan.validator';
import { ConflictError, NotFoundError, BadRequestError } from '../utils/apiResponse';
import { generateNextChallanNumber } from '../utils/challanNumber';
import { ChallanStatus, Prisma } from '@prisma/client';

export async function createChallan(input: CreateChallanInput, actorId: string) {
  // Verify customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId },
  });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  // Fetch all product snapshots from DB
  const productIds = input.items.map((item) => item.productId);
  const dbProducts = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (dbProducts.length !== productIds.length) {
    throw new NotFoundError('One or more products not found');
  }

  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  // If creating directly as CONFIRMED, run confirmation logic within transaction
  if (input.status === ChallanStatus.CONFIRMED) {
    return prisma.$transaction(async (tx) => {
      const challanNumber = await generateNextChallanNumber(tx);
      let totalQty = 0;

      // Verify stock for all items
      for (const item of input.items) {
        const prod = productMap.get(item.productId);
        if (!prod) throw new NotFoundError('Product not found');

        if (prod.currentStock < item.quantity) {
          throw new ConflictError(
            `Insufficient stock for product '${prod.productName}'. Requested: ${item.quantity}, Available: ${prod.currentStock}`
          );
        }
        totalQty += item.quantity;
      }

      // Create Challan
      const challan = await tx.challan.create({
        data: {
          challanNumber,
          customerId: input.customerId,
          totalQuantity: totalQty,
          status: ChallanStatus.CONFIRMED,
          createdBy: actorId,
        },
      });

      // Process items, update stock, write stock movements
      for (const item of input.items) {
        const prod = productMap.get(item.productId)!;
        const total = item.quantity * prod.unitPrice;

        await tx.challanItem.create({
          data: {
            challanId: challan.id,
            productId: item.productId,
            productName: prod.productName,
            sku: prod.sku,
            unitPrice: prod.unitPrice,
            quantity: item.quantity,
            total,
          },
        });

        // Deduct stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: item.quantity,
            },
          },
        });

        // Log Stock OUT
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'OUT',
            reason: `Sales Challan ${challanNumber}`,
            createdBy: actorId,
          },
        });
      }

      // Log Audit
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'CREATE_CONFIRMED',
          entity: 'Challan',
          entityId: challan.id,
          newValue: JSON.stringify(challan),
        },
      });

      return tx.challan.findUnique({
        where: { id: challan.id },
        include: { items: true, customer: true },
      });
    }, { timeout: 20000 });
  } else {
    // Save as DRAFT
    return prisma.$transaction(async (tx) => {
      const challanNumber = await generateNextChallanNumber(tx);
      let totalQty = 0;

      const challan = await tx.challan.create({
        data: {
          challanNumber,
          customerId: input.customerId,
          totalQuantity: 0, // will calculate and update or save
          status: ChallanStatus.DRAFT,
          createdBy: actorId,
        },
      });

      for (const item of input.items) {
        const prod = productMap.get(item.productId)!;
        const total = item.quantity * prod.unitPrice;
        totalQty += item.quantity;

        await tx.challanItem.create({
          data: {
            challanId: challan.id,
            productId: item.productId,
            productName: prod.productName,
            sku: prod.sku,
            unitPrice: prod.unitPrice,
            quantity: item.quantity,
            total,
          },
        });
      }

      const updatedChallan = await tx.challan.update({
        where: { id: challan.id },
        data: {
          totalQuantity: totalQty,
        },
        include: { items: true, customer: true },
      });

      // Log Audit
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'CREATE_DRAFT',
          entity: 'Challan',
          entityId: challan.id,
          newValue: JSON.stringify(updatedChallan),
        },
      });

      return updatedChallan;
    }, { timeout: 20000 });
  }
}

export async function updateChallan(id: string, input: UpdateChallanInput, actorId: string) {
  const challan = await prisma.challan.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!challan) {
    throw new NotFoundError('Challan not found');
  }

  if (challan.status !== ChallanStatus.DRAFT) {
    throw new BadRequestError('Only Draft challans can be edited');
  }

  return prisma.$transaction(async (tx) => {
    // If updating customer
    if (input.customerId && input.customerId !== challan.customerId) {
      const customer = await tx.customer.findUnique({
        where: { id: input.customerId },
      });
      if (!customer) throw new NotFoundError('Customer not found');
    }

    // Delete existing items if new ones are provided
    if (input.items) {
      await tx.challanItem.deleteMany({
        where: { challanId: id },
      });

      // Fetch products
      const productIds = input.items.map((item) => item.productId);
      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      if (dbProducts.length !== productIds.length) {
        throw new NotFoundError('One or more products not found');
      }

      const productMap = new Map(dbProducts.map((p) => [p.id, p]));
      let totalQty = 0;

      for (const item of input.items) {
        const prod = productMap.get(item.productId)!;
        const total = item.quantity * prod.unitPrice;
        totalQty += item.quantity;

        await tx.challanItem.create({
          data: {
            challanId: id,
            productId: item.productId,
            productName: prod.productName,
            sku: prod.sku,
            unitPrice: prod.unitPrice,
            quantity: item.quantity,
            total,
          },
        });
      }

      await tx.challan.update({
        where: { id },
        data: {
          customerId: input.customerId ?? challan.customerId,
          totalQuantity: totalQty,
        },
      });
    } else if (input.customerId) {
      await tx.challan.update({
        where: { id },
        data: { customerId: input.customerId },
      });
    }

    const updated = await tx.challan.findUnique({
      where: { id },
      include: { items: true, customer: true },
    });

    // Log Audit
    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: 'UPDATE_DRAFT',
        entity: 'Challan',
        entityId: id,
        oldValue: JSON.stringify(challan),
        newValue: JSON.stringify(updated),
      },
    });

    return updated;
  }, { timeout: 20000 });
}

export async function confirmChallan(id: string, actorId: string) {
  return prisma.$transaction(async (tx) => {
    // 1. Fetch and lock challan
    const challan = await tx.challan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) {
      throw new NotFoundError('Challan not found');
    }

    // 2. Check status is DRAFT
    if (challan.status === ChallanStatus.CONFIRMED) {
      throw new BadRequestError('Challan is already confirmed');
    }
    if (challan.status === ChallanStatus.CANCELLED) {
      throw new BadRequestError('Cannot confirm a cancelled challan');
    }

    // 3. Verify stock for all items
    const productIds = challan.items.map((item) => item.productId);
    const dbProducts = await tx.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    for (const item of challan.items) {
      const prod = productMap.get(item.productId);
      if (!prod) {
        throw new NotFoundError(`Product not found for item ${item.productName}`);
      }

      if (prod.currentStock < item.quantity) {
        throw new ConflictError(
          `Insufficient stock for product '${prod.productName}'. Requested: ${item.quantity}, Available: ${prod.currentStock}`
        );
      }
    }

    // 4. Update stock and create stock movement logs
    for (const item of challan.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          currentStock: {
            decrement: item.quantity,
          },
        },
      });

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          movementType: 'OUT',
          reason: `Sales Challan ${challan.challanNumber}`,
          createdBy: actorId,
        },
      });
    }

    // 5. Update Challan status to CONFIRMED
    const confirmedChallan = await tx.challan.update({
      where: { id },
      data: {
        status: ChallanStatus.CONFIRMED,
      },
      include: { items: true, customer: true },
    });

    // Log Audit
    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: 'CONFIRM_CHALLAN',
        entity: 'Challan',
        entityId: id,
        oldValue: JSON.stringify(challan),
        newValue: JSON.stringify(confirmedChallan),
      },
    });

    return confirmedChallan;
  }, { timeout: 20000 });
}

export async function cancelChallan(id: string, actorId: string) {
  return prisma.$transaction(async (tx) => {
    const challan = await tx.challan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) {
      throw new NotFoundError('Challan not found');
    }

    if (challan.status === ChallanStatus.CANCELLED) {
      throw new BadRequestError('Challan is already cancelled');
    }

    // If CANCELLED from CONFIRMED: return items back to stock
    if (challan.status === ChallanStatus.CONFIRMED) {
      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              increment: item.quantity,
            },
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'IN',
            reason: `Restock - Cancelled Challan ${challan.challanNumber}`,
            createdBy: actorId,
          },
        });
      }
    }

    const cancelledChallan = await tx.challan.update({
      where: { id },
      data: {
        status: ChallanStatus.CANCELLED,
      },
      include: { items: true, customer: true },
    });

    // Log Audit
    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: 'CANCEL_CHALLAN',
        entity: 'Challan',
        entityId: id,
        oldValue: JSON.stringify(challan),
        newValue: JSON.stringify(cancelledChallan),
      },
    });

    return cancelledChallan;
  }, { timeout: 20000 });
}

export async function getChallanById(id: string) {
  const challan = await prisma.challan.findUnique({
    where: { id },
    include: {
      items: true,
      customer: true,
      creator: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  if (!challan) {
    throw new NotFoundError('Challan not found');
  }

  return challan;
}

export async function queryChallans(params: {
  search?: string;
  customerId?: string;
  status?: ChallanStatus;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
  skip: number;
}) {
  const where: Prisma.ChallanWhereInput = {};

  if (params.search) {
    where.OR = [
      { challanNumber: { contains: params.search, mode: 'insensitive' } },
      {
        customer: {
          customerName: { contains: params.search, mode: 'insensitive' },
        },
      },
      {
        customer: {
          businessName: { contains: params.search, mode: 'insensitive' },
        },
      },
    ];
  }

  if (params.customerId) {
    where.customerId = params.customerId;
  }

  if (params.status) {
    where.status = params.status;
  }

  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) {
      where.createdAt.gte = params.startDate;
    }
    if (params.endDate) {
      where.createdAt.lte = params.endDate;
    }
  }

  const [total, challans] = await Promise.all([
    prisma.challan.count({ where }),
    prisma.challan.findMany({
      where,
      skip: params.skip,
      take: params.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, customerName: true, businessName: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
  ]);

  return {
    total,
    challans,
  };
}
