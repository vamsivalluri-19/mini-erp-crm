import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import bcrypt from 'bcrypt';
import { UserRole, CustomerType, CustomerStatus, ChallanStatus } from '@prisma/client';

describe('OpsFlow ERP Integration Tests', () => {
  let adminToken = '';
  let salesToken = '';
  let warehouseToken = '';

  let customerId = '';
  let productId = '';
  let challanId = '';

  beforeAll(async () => {
    // Clear test records
    await prisma.auditLog.deleteMany({});
    await prisma.challanItem.deleteMany({});
    await prisma.challan.deleteMany({});
    await prisma.stockMovement.deleteMany({});
    await prisma.customerFollowUp.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});

    // Hash passwords
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('Test@123', saltRounds);

    // Seed test users
    await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin_test@opsflow.com',
        password: passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
      },
    });

    await prisma.user.create({
      data: {
        name: 'Sales User',
        email: 'sales_test@opsflow.com',
        password: passwordHash,
        role: UserRole.SALES,
        isActive: true,
      },
    });

    await prisma.user.create({
      data: {
        name: 'Warehouse User',
        email: 'warehouse_test@opsflow.com',
        password: passwordHash,
        role: UserRole.WAREHOUSE,
        isActive: true,
      },
    });

    // Obtain tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin_test@opsflow.com', password: 'Test@123' });
    adminToken = adminLogin.body.data.token;

    const salesLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sales_test@opsflow.com', password: 'Test@123' });
    salesToken = salesLogin.body.data.token;

    const warehouseLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'warehouse_test@opsflow.com', password: 'Test@123' });
    warehouseToken = warehouseLogin.body.data.token;
  }, 30000);

  afterAll(async () => {
    // Disconnect
    await prisma.$disconnect();
  });

  describe('Authentication & RBAC', () => {
    it('should fail login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin_test@opsflow.com', password: 'wrongpassword' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should retrieve current user details', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('admin_test@opsflow.com');
    });

    it('should deny non-admin from creating users', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          name: 'New User',
          email: 'new_user@opsflow.com',
          password: 'Password@123',
          role: UserRole.ACCOUNTS,
        });
      expect(res.status).toBe(403);
    });

    it('should allow admin to create user', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Alex Accounts',
          email: 'accounts_test@opsflow.com',
          password: 'Password@123',
          role: UserRole.ACCOUNTS,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe('accounts_test@opsflow.com');
    });
  });

  describe('CRM Customer Module', () => {
    it('should create customer', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          customerName: 'Acme Corporates Test',
          businessName: 'Acme Test Ltd',
          mobile: '9999999999',
          email: 'test@acme.com',
          customerType: CustomerType.WHOLESALE,
          status: CustomerStatus.ACTIVE,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.customerName).toBe('Acme Corporates Test');
      customerId = res.body.data.id;
    });

    it('should update customer', async () => {
      const res = await request(app)
        .put(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          notes: 'Important wholesale tester client.',
        });
      expect(res.status).toBe(200);
      expect(res.body.data.notes).toBe('Important wholesale tester client.');
    });

    it('should create customer follow-up CRM note', async () => {
      const res = await request(app)
        .post(`/api/customers/${customerId}/followups`)
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          note: 'Initial call made to discuss catalog.',
          followUpDate: new Date(),
        });
      expect(res.status).toBe(201);
      expect(res.body.data.note).toBe('Initial call made to discuss catalog.');
    });
  });

  describe('Inventory Product Module', () => {
    it('should prevent Sales from creating products', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          productName: 'Heavy Cable Test',
          sku: 'CAB-TEST-1',
          category: 'Cables',
          unitPrice: 500,
          currentStock: 100,
          minimumStock: 10,
        });
      expect(res.status).toBe(403);
    });

    it('should allow Warehouse to create product', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({
          productName: 'Gigabit Hub Test',
          sku: 'NET-HUB-TEST',
          category: 'Networking',
          unitPrice: 2000,
          currentStock: 100,
          minimumStock: 10,
        });
      expect(res.status).toBe(201);
      productId = res.body.data.id;
    });

    it('should record opening stock movement', async () => {
      const res = await request(app)
        .get(`/api/stock/products/${productId}`)
        .set('Authorization', `Bearer ${warehouseToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].reason).toBe('Opening Stock');
      expect(res.body.data[0].quantity).toBe(100);
    });
  });

  describe('Sales Challan Lifecycle & Concurrency', () => {
    it('should allow Sales to create Draft Challan', async () => {
      const res = await request(app)
        .post('/api/challans')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          customerId,
          items: [{ productId, quantity: 20 }],
          status: ChallanStatus.DRAFT,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe(ChallanStatus.DRAFT);
      challanId = res.body.data.id;

      // Verify product stock is still 100
      const prodRes = await request(app)
        .get(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${salesToken}`);
      expect(prodRes.body.data.currentStock).toBe(100);
    });

    it('should reject confirmation of challan if requested quantity exceeds stock', async () => {
      // Create draft challan for 200 items (we only have 100)
      const overdraftRes = await request(app)
        .post('/api/challans')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          customerId,
          items: [{ productId, quantity: 200 }],
          status: ChallanStatus.DRAFT,
        });
      
      const overChallanId = overdraftRes.body.data.id;

      const confirmRes = await request(app)
        .post(`/api/challans/${overChallanId}/confirm`)
        .set('Authorization', `Bearer ${salesToken}`);
      
      expect(confirmRes.status).toBe(409); // Conflict - Insufficient stock
      expect(confirmRes.body.success).toBe(false);

      // Verify stock remains 100
      const prodRes = await request(app)
        .get(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${salesToken}`);
      expect(prodRes.body.data.currentStock).toBe(100);
    });

    it('should confirm Draft Challan and deduct stock atomically', async () => {
      const res = await request(app)
        .post(`/api/challans/${challanId}/confirm`)
        .set('Authorization', `Bearer ${salesToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(ChallanStatus.CONFIRMED);

      // Verify product stock dropped to 80
      const prodRes = await request(app)
        .get(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${salesToken}`);
      expect(prodRes.body.data.currentStock).toBe(80);

      // Verify Stock movement (OUT) of 20 was logged
      const movementRes = await request(app)
        .get(`/api/stock/products/${productId}`)
        .set('Authorization', `Bearer ${warehouseToken}`);
      
      expect(movementRes.body.data.length).toBe(2);
      expect(movementRes.body.data[0].movementType).toBe('OUT');
      expect(movementRes.body.data[0].quantity).toBe(20);
      expect(movementRes.body.data[0].reason).toContain('Sales Challan');
    });
  });
});
