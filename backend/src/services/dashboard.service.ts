import { prisma } from '../config/database';
import { CustomerStatus, ChallanStatus } from '@prisma/client';

export async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Run aggregations in parallel
  const [
    customerStats,
    productStats,
    challanStats,
    stockMovementsStats,
    recentChallans,
    recentMovements,
    lowStockList,
    followUpsList,
  ] = await Promise.all([
    // Customers count
    prisma.$transaction([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: CustomerStatus.ACTIVE } }),
      prisma.customer.count({ where: { status: CustomerStatus.LEAD } }),
      prisma.customer.count({ where: { status: CustomerStatus.INACTIVE } }),
    ]),
    // Products and Stock count
    prisma.$transaction([
      prisma.product.count(),
      prisma.product.aggregate({
        _sum: { currentStock: true },
      }),
      prisma.product.count({
        where: {
          currentStock: {
            lte: prisma.product.fields.minimumStock,
            gt: 0,
          },
        },
      }),
      prisma.product.count({
        where: { currentStock: 0 },
      }),
    ]),
    // Challans count
    prisma.$transaction([
      prisma.challan.count(),
      prisma.challan.count({ where: { status: ChallanStatus.DRAFT } }),
      prisma.challan.count({ where: { status: ChallanStatus.CONFIRMED } }),
      prisma.challan.count({ where: { status: ChallanStatus.CANCELLED } }),
    ]),
    // Stock movement aggregates
    prisma.$transaction([
      prisma.stockMovement.aggregate({
        where: { movementType: 'IN' },
        _sum: { quantity: true },
      }),
      prisma.stockMovement.aggregate({
        where: { movementType: 'OUT' },
        _sum: { quantity: true },
      }),
    ]),
    // Recent Challans (5)
    prisma.challan.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { customerName: true, businessName: true } },
      },
    }),
    // Recent Stock Movements (5)
    prisma.stockMovement.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { productName: true, sku: true } },
      },
    }),
    // Low stock list (5)
    prisma.product.findMany({
      where: {
        currentStock: {
          lte: prisma.product.fields.minimumStock,
        },
      },
      take: 5,
      orderBy: { currentStock: 'asc' },
    }),
    // Follow ups: overdue, today, upcoming
    prisma.customer.findMany({
      where: {
        followUpDate: { not: null },
      },
      select: {
        id: true,
        customerName: true,
        businessName: true,
        followUpDate: true,
        status: true,
      },
    }),
  ]);

  // Process followups lists
  const overdueFollowUps = [];
  const todayFollowUps = [];
  const upcomingFollowUps = [];

  for (const cust of followUpsList) {
    if (!cust.followUpDate) continue;
    const fDate = new Date(cust.followUpDate);
    fDate.setHours(0, 0, 0, 0);

    const record = {
      id: cust.id,
      customerName: cust.customerName,
      businessName: cust.businessName,
      followUpDate: cust.followUpDate,
    };

    if (fDate.getTime() < today.getTime()) {
      overdueFollowUps.push(record);
    } else if (fDate.getTime() === today.getTime()) {
      todayFollowUps.push(record);
    } else {
      upcomingFollowUps.push(record);
    }
  }

  // Sort lists
  overdueFollowUps.sort((a, b) => b.followUpDate.getTime() - a.followUpDate.getTime());
  todayFollowUps.sort((a, b) => a.followUpDate.getTime() - b.followUpDate.getTime());
  upcomingFollowUps.sort((a, b) => a.followUpDate.getTime() - b.followUpDate.getTime());

  // Aggregate monthly challan values for charts
  const monthlyChallans = await prisma.$queryRaw`
    SELECT 
      TO_CHAR(c."createdAt", 'Mon YYYY') as "month",
      COUNT(c.id)::int as "count",
      SUM(CASE WHEN c.status = 'CONFIRMED' THEN c."totalQuantity" ELSE 0 END)::int as "confirmedQuantity",
      SUM(CASE WHEN c.status = 'DRAFT' THEN c."totalQuantity" ELSE 0 END)::int as "draftQuantity"
    FROM "Challan" c
    GROUP BY TO_CHAR(c."createdAt", 'Mon YYYY'), DATE_TRUNC('month', c."createdAt")
    ORDER BY DATE_TRUNC('month', c."createdAt") DESC
    LIMIT 6
  `;

  return {
    customers: {
      total: customerStats[0],
      active: customerStats[1],
      lead: customerStats[2],
      inactive: customerStats[3],
    },
    products: {
      total: productStats[0],
      totalStockUnits: productStats[1]._sum.currentStock || 0,
      lowStock: productStats[2],
      outOfStock: productStats[3],
    },
    challans: {
      total: challanStats[0],
      draft: challanStats[1],
      confirmed: challanStats[2],
      cancelled: challanStats[3],
    },
    stockMovements: {
      totalStockIn: stockMovementsStats[0]._sum.quantity || 0,
      totalStockOut: stockMovementsStats[1]._sum.quantity || 0,
    },
    recentChallans,
    recentMovements,
    lowStockList,
    followUps: {
      overdue: overdueFollowUps.slice(0, 10),
      today: todayFollowUps.slice(0, 10),
      upcoming: upcomingFollowUps.slice(0, 10),
    },
    charts: {
      monthlyChallans: (monthlyChallans as any[] || []).reverse(),
    },
  };
}
