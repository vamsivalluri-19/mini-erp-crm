import { PrismaClient, UserRole, CustomerType, CustomerStatus, StockMovementType, ChallanStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Clean Database
  console.log('Clearing existing data...');
  await prisma.auditLog.deleteMany({});
  await prisma.challanItem.deleteMany({});
  await prisma.challan.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.customerFollowUp.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Hash passwords
  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('Admin@123', saltRounds);
  const salesPassword = await bcrypt.hash('Sales@123', saltRounds);
  const warehousePassword = await bcrypt.hash('Warehouse@123', saltRounds);
  const accountsPassword = await bcrypt.hash('Accounts@123', saltRounds);

  // 3. Create Users
  console.log('Creating users...');
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@opsflow.com',
      password: adminPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const sales = await prisma.user.create({
    data: {
      name: 'Sarah Sales',
      email: 'sales@opsflow.com',
      password: salesPassword,
      role: UserRole.SALES,
      isActive: true,
    },
  });

  const warehouse = await prisma.user.create({
    data: {
      name: 'Walter Warehouse',
      email: 'warehouse@opsflow.com',
      password: warehousePassword,
      role: UserRole.WAREHOUSE,
      isActive: true,
    },
  });

  const accounts = await prisma.user.create({
    data: {
      name: 'Alex Accounts',
      email: 'accounts@opsflow.com',
      password: accountsPassword,
      role: UserRole.ACCOUNTS,
      isActive: true,
    },
  });

  console.log(`Created users: ${admin.email}, ${sales.email}, ${warehouse.email}, ${accounts.email}`);

  // 4. Create Customers
  console.log('Creating customers...');
  const customer1 = await prisma.customer.create({
    data: {
      customerName: 'Acme Corporates',
      businessName: 'Acme Corp Pvt Ltd',
      mobile: '9876543210',
      email: 'procurement@acme.com',
      gstNumber: '27AAAAA1111A1Z5',
      customerType: CustomerType.WHOLESALE,
      address: 'Industrial Area Phase 2, Mumbai, MH',
      status: CustomerStatus.ACTIVE,
      notes: 'Key wholesaler client. Pays in 30-day cycles.',
    },
  });

  await prisma.customer.create({
    data: {
      customerName: 'Globex Enterprises',
      businessName: 'Globex Distributing',
      mobile: '8765432109',
      email: 'info@globex.net',
      gstNumber: '19BBBBB2222B2Z6',
      customerType: CustomerType.DISTRIBUTOR,
      address: 'Tech Park Layout, Bangalore, KA',
      status: CustomerStatus.ACTIVE,
      notes: 'Large scale southern distributor.',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      customerName: 'John Doe Retail',
      businessName: 'Doe Convenience Store',
      mobile: '7654321098',
      email: 'johndoe@retail.com',
      customerType: CustomerType.RETAIL,
      address: 'Main Street Sector 4, Delhi',
      status: CustomerStatus.LEAD,
      notes: 'New retail store. Interested in packaging deals.',
    },
  });

  await prisma.customer.create({
    data: {
      customerName: 'Legacy Retailers',
      businessName: 'Legacy General Store',
      mobile: '6543210987',
      email: 'legacy@gmail.com',
      customerType: CustomerType.RETAIL,
      address: 'Old Market Road, Pune, MH',
      status: CustomerStatus.INACTIVE,
      notes: 'Has not placed orders in past 6 months.',
    },
  });

  // 5. Create Customer Follow-ups (CRM)
  console.log('Creating follow-ups...');
  await prisma.customerFollowUp.create({
    data: {
      customerId: customer1.id,
      note: 'Called client regarding renewal of supply agreement. They requested pricing for Bulk Cables.',
      followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days in future
      createdBy: sales.id,
    },
  });

  // Update customer follow up date
  await prisma.customer.update({
    where: { id: customer1.id },
    data: { followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
  });

  await prisma.customerFollowUp.create({
    data: {
      customerId: customer3.id,
      note: 'Introductory email sent with product catalog.',
      followUpDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Overdue: 1 day in past
      createdBy: sales.id,
    },
  });

  await prisma.customer.update({
    where: { id: customer3.id },
    data: { followUpDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
  });

  // 6. Create Products
  console.log('Creating products...');
  const prod1 = await prisma.product.create({
    data: {
      productName: 'Heavy Duty Power Cable 10m',
      sku: 'CAB-HD-10M',
      category: 'Cables',
      unitPrice: 1200.0,
      currentStock: 120,
      minimumStock: 30,
      warehouseLocation: 'Shelf A3',
    },
  });

  const prod2 = await prisma.product.create({
    data: {
      productName: 'Cat6 Ethernet Cable 300m Box',
      sku: 'CAB-CAT6-300',
      category: 'Cables',
      unitPrice: 3500.0,
      currentStock: 45,
      minimumStock: 15,
      warehouseLocation: 'Shelf A4',
    },
  });

  const prod3 = await prisma.product.create({
    data: {
      productName: 'Industrial Gigabit Router',
      sku: 'NET-RT-GIG',
      category: 'Networking',
      unitPrice: 8500.0,
      currentStock: 8, // Low Stock! (min is 10)
      minimumStock: 10,
      warehouseLocation: 'Cabinet B1',
    },
  });

  await prisma.product.create({
    data: {
      productName: 'Fiber Optic Transceiver',
      sku: 'NET-TR-FIB',
      category: 'Networking',
      unitPrice: 450.0,
      currentStock: 0, // Out of Stock! (min is 5)
      minimumStock: 5,
      warehouseLocation: 'Cabinet B2',
    },
  });

  // 7. Create Opening Stock Movements
  console.log('Recording opening stock movements...');
  const productsList = [prod1, prod2, prod3];
  for (const prod of productsList) {
    await prisma.stockMovement.create({
      data: {
        productId: prod.id,
        quantity: prod.currentStock,
        movementType: StockMovementType.IN,
        reason: 'Opening Stock',
        createdBy: warehouse.id,
      },
    });
  }

  // 8. Create Challans
  console.log('Creating sample challans...');

  // A. CONFIRMED CHALLAN (stock already deducted)
  // Let's create a confirmed challan with Acme Corporates for 10 Gigabit Routers
  // Wait, the router stock is 8 now, so let's say they bought 5 router units, stock dropped from 13 to 8
  const confirmedChallan = await prisma.challan.create({
    data: {
      challanNumber: 'CH-000001',
      customerId: customer1.id,
      totalQuantity: 5,
      status: ChallanStatus.CONFIRMED,
      createdBy: sales.id,
    },
  });

  await prisma.challanItem.create({
    data: {
      challanId: confirmedChallan.id,
      productId: prod3.id,
      productName: prod3.productName,
      sku: prod3.sku,
      unitPrice: prod3.unitPrice,
      quantity: 5,
      total: 5 * prod3.unitPrice,
    },
  });

  // Stock movement out for confirmed challan
  await prisma.stockMovement.create({
    data: {
      productId: prod3.id,
      quantity: 5,
      movementType: StockMovementType.OUT,
      reason: `Sales Challan CH-000001`,
      createdBy: sales.id,
    },
  });

  // B. DRAFT CHALLAN (stock not deducted)
  // Acme Corporates draft for 10 Power Cables
  const draftChallan = await prisma.challan.create({
    data: {
      challanNumber: 'CH-000002',
      customerId: customer1.id,
      totalQuantity: 10,
      status: ChallanStatus.DRAFT,
      createdBy: sales.id,
    },
  });

  await prisma.challanItem.create({
    data: {
      challanId: draftChallan.id,
      productId: prod1.id,
      productName: prod1.productName,
      sku: prod1.sku,
      unitPrice: prod1.unitPrice,
      quantity: 10,
      total: 10 * prod1.unitPrice,
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
