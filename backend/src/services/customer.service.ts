import { prisma } from '../config/database';
import { CreateCustomerInput, UpdateCustomerInput, CreateFollowUpInput } from '../validators/customer.validator';
import { NotFoundError } from '../utils/apiResponse';
import { Prisma, CustomerStatus, CustomerType } from '@prisma/client';

export async function createCustomer(input: CreateCustomerInput, actorId: string) {
  const customer = await prisma.customer.create({
    data: {
      customerName: input.customerName,
      mobile: input.mobile,
      email: input.email || null,
      businessName: input.businessName,
      gstNumber: input.gstNumber || null,
      customerType: input.customerType,
      address: input.address || null,
      status: input.status,
      followUpDate: input.followUpDate || null,
      notes: input.notes || null,
    },
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action: 'CREATE',
      entity: 'Customer',
      entityId: customer.id,
      newValue: JSON.stringify(customer),
    },
  });

  return customer;
}

export async function updateCustomer(id: string, input: UpdateCustomerInput, actorId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  const updated = await prisma.customer.update({
    where: { id },
    data: {
      customerName: input.customerName,
      mobile: input.mobile,
      email: input.email !== undefined ? (input.email || null) : undefined,
      businessName: input.businessName,
      gstNumber: input.gstNumber !== undefined ? (input.gstNumber || null) : undefined,
      customerType: input.customerType,
      address: input.address,
      status: input.status,
      followUpDate: input.followUpDate,
      notes: input.notes,
    },
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action: 'UPDATE',
      entity: 'Customer',
      entityId: customer.id,
      oldValue: JSON.stringify(customer),
      newValue: JSON.stringify(updated),
    },
  });

  return updated;
}

export async function deleteCustomer(id: string, actorId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  // Check if customer has challans
  const challanCount = await prisma.challan.count({
    where: { customerId: id },
  });

  if (challanCount > 0) {
    throw new Error('Cannot delete customer with historical transactions (sales challans)');
  }

  await prisma.customer.delete({
    where: { id },
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action: 'DELETE',
      entity: 'Customer',
      entityId: id,
      oldValue: JSON.stringify(customer),
    },
  });

  return { id };
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      followUps: {
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
    },
  });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  return customer;
}

export async function queryCustomers(params: {
  search?: string;
  status?: string;
  customerType?: string;
  page: number;
  limit: number;
  skip: number;
}) {
  const where: Prisma.CustomerWhereInput = {};

  if (params.search) {
    where.OR = [
      { customerName: { contains: params.search, mode: 'insensitive' } },
      { businessName: { contains: params.search, mode: 'insensitive' } },
      { mobile: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
      { gstNumber: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  if (params.status) {
    where.status = params.status as CustomerStatus;
  }

  if (params.customerType) {
    where.customerType = params.customerType as CustomerType;
  }

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      skip: params.skip,
      take: params.limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    total,
    customers,
  };
}

// CRM FOLLOW UP SERVICES

export async function addFollowUp(customerId: string, input: CreateFollowUpInput, actorId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  const followUp = await prisma.customerFollowUp.create({
    data: {
      customerId,
      note: input.note,
      followUpDate: input.followUpDate,
      createdBy: actorId,
    },
    include: {
      creator: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  // Automatically update follow-up date in customer profile
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      followUpDate: input.followUpDate,
    },
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action: 'ADD_FOLLOWUP',
      entity: 'CustomerFollowUp',
      entityId: followUp.id,
      newValue: JSON.stringify(followUp),
    },
  });

  return followUp;
}

export async function updateFollowUp(
  customerId: string,
  followUpId: string,
  input: CreateFollowUpInput,
  _actorId: string
) {
  const followUp = await prisma.customerFollowUp.findFirst({
    where: { id: followUpId, customerId },
  });

  if (!followUp) {
    throw new NotFoundError('Follow-up record not found');
  }

  const updated = await prisma.customerFollowUp.update({
    where: { id: followUpId },
    data: {
      note: input.note,
      followUpDate: input.followUpDate,
    },
    include: {
      creator: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  // Update customer's follow up date if this is the newest one
  const newestFollowUp = await prisma.customerFollowUp.findFirst({
    where: { customerId },
    orderBy: { followUpDate: 'desc' },
  });

  if (newestFollowUp) {
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        followUpDate: newestFollowUp.followUpDate,
      },
    });
  }

  return updated;
}

export async function deleteFollowUp(customerId: string, followUpId: string, actorId: string) {
  const followUp = await prisma.customerFollowUp.findFirst({
    where: { id: followUpId, customerId },
  });

  if (!followUp) {
    throw new NotFoundError('Follow-up record not found');
  }

  await prisma.customerFollowUp.delete({
    where: { id: followUpId },
  });

  // Update customer's follow-up date
  const newestFollowUp = await prisma.customerFollowUp.findFirst({
    where: { customerId },
    orderBy: { followUpDate: 'desc' },
  });

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      followUpDate: newestFollowUp ? newestFollowUp.followUpDate : null,
    },
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action: 'DELETE_FOLLOWUP',
      entity: 'CustomerFollowUp',
      entityId: followUpId,
      oldValue: JSON.stringify(followUp),
    },
  });

  return { id: followUpId };
}
