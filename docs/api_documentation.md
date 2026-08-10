# OpsFlow ERP - API Documentation

The backend exposes a secure REST API with JWT authorization and Role-Based Access Control (RBAC).

## Base URL
```text
http://localhost:5000/api
```

## Headers
For all authenticated routes, include:
```text
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## 1. Authentication

### Login
* **Method**: `POST`
* **Endpoint**: `/auth/login`
* **Request Body**:
  ```json
  {
    "email": "sales@opsflow.com",
    "password": "Sales@123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOi...",
      "user": {
        "id": "76efc4fa-...",
        "name": "Sarah Sales",
        "email": "sales@opsflow.com",
        "role": "SALES"
      }
    }
  }
  ```

### Get Profile
* **Method**: `GET`
* **Endpoint**: `/auth/me`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User profile retrieved successfully",
    "data": {
      "id": "76efc4fa-...",
      "name": "Sarah Sales",
      "email": "sales@opsflow.com",
      "role": "SALES",
      "isActive": true
    }
  }
  ```

### Logout
* **Method**: `POST`
* **Endpoint**: `/auth/logout`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logout successful"
  }
  ```

---

## 2. Customer CRM (`/customers`)

### Get Customers (List)
* **Method**: `GET`
* **Endpoint**: `/customers`
* **Query Parameters**:
  * `page` (optional, default: 1)
  * `limit` (optional, default: 10)
  * `search` (optional, searches name, business, mobile, email, GST)
  * `status` (optional: `LEAD`, `ACTIVE`, `INACTIVE`)
  * `customerType` (optional: `RETAIL`, `WHOLESALE`, `DISTRIBUTOR`)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "c88b0f45-...",
        "customerName": "Acme Corporates",
        "businessName": "Acme Corp Pvt Ltd",
        "mobile": "9876543210",
        "email": "procurement@acme.com",
        "customerType": "WHOLESALE",
        "status": "ACTIVE",
        "followUpDate": "2026-08-12T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
  ```

### Create Customer
* **Method**: `POST`
* **Endpoint**: `/customers`
* **Roles Allowed**: `ADMIN`, `SALES`
* **Request Body**:
  ```json
  {
    "customerName": "Beta Retailers",
    "businessName": "Beta General Store",
    "mobile": "9998887776",
    "email": "beta@gmail.com",
    "customerType": "RETAIL",
    "address": "4th Avenue, Mumbai",
    "status": "LEAD"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Customer created successfully",
    "data": { ... }
  }
  ```

### Customer Follow-Ups CRM Note
* **Method**: `POST`
* **Endpoint**: `/customers/:id/followups`
* **Roles Allowed**: `ADMIN`, `SALES`
* **Request Body**:
  ```json
  {
    "note": "Called client regarding bulk wires delivery.",
    "followUpDate": "2026-08-15T00:00:00.000Z"
  }
  ```

---

## 3. Product Catalog (`/products`)

### Get Products
* **Method**: `GET`
* **Endpoint**: `/products`
* **Query Parameters**:
  * `search` (name, SKU)
  * `category`
  * `lowStock` (`true` filters where stock <= minimumStock)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "e2bb13b9-...",
        "productName": "Heavy Duty Power Cable 10m",
        "sku": "CAB-HD-10M",
        "category": "Cables",
        "unitPrice": 1200.0,
        "currentStock": 120,
        "minimumStock": 30,
        "warehouseLocation": "Shelf A3"
      }
    ]
  }
  ```

---

## 4. Inventory Stock Adjustments (`/stock`)

### Adjust Stock
* **Method**: `POST`
* **Endpoint**: `/stock/movements`
* **Roles Allowed**: `ADMIN`, `WAREHOUSE`
* **Request Body**:
  ```json
  {
    "productId": "e2bb13b9-...",
    "quantity": 50,
    "movementType": "IN",
    "reason": "New Shipment Received"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Stock adjusted successfully",
    "data": {
      "product": { ... },
      "movement": { ... }
    }
  }
  ```

---

## 5. Sales Challan (`/challans`)

### Create Challan (Draft or Confirmed)
* **Method**: `POST`
* **Endpoint**: `/challans`
* **Roles Allowed**: `ADMIN`, `SALES`
* **Request Body**:
  ```json
  {
    "customerId": "c88b0f45-...",
    "items": [
      {
        "productId": "e2bb13b9-...",
        "quantity": 5
      }
    ],
    "status": "DRAFT"
  }
  ```

### Confirm Challan (Atomic stock adjustment)
* **Method**: `POST`
* **Endpoint**: `/challans/:id/confirm`
* **Roles Allowed**: `ADMIN`, `SALES`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Challan confirmed successfully",
    "data": {
      "id": "h33c99...",
      "challanNumber": "CH-000003",
      "status": "CONFIRMED",
      "totalQuantity": 5
    }
  }
  ```
* **Error Response (409 Conflict - Insufficient Stock)**:
  ```json
  {
    "success": false,
    "message": "Insufficient stock for product 'Heavy Duty Power Cable 10m'. Requested: 200, Available: 120"
  }
  ```

### Cancel Challan (Restores stock if was Confirmed)
* **Method**: `POST`
* **Endpoint**: `/challans/:id/cancel`
* **Roles Allowed**: `ADMIN`, `SALES`
