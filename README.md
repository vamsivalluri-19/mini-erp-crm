# OpsFlow ERP - Mini ERP + CRM Operations Portal

A complete, production-grade, role-authorized full-stack ERP and CRM portal for a wholesale/distribution company. 

Built using React, TypeScript, Node.js, Express, Prisma, Tailwind CSS, and PostgreSQL.

---

## 🛠️ Tech Stack

### Backend
* **Runtime**: Node.js + TypeScript
* **Framework**: Express.js
* **Database Client**: Prisma ORM with remote Neon PostgreSQL (AWS East)
* **Testing**: Vitest + Supertest integration tests
* **Security**: JWT Authentication with Role-Based Access Control (RBAC)

### Frontend
* **Build System**: Vite + React + TypeScript
* **Styling**: Tailwind CSS v3 + Lucide Icons + Google Fonts (Inter)
* **Forms**: React Hook Form + Zod validator
* **Charts**: Recharts analytics trends

---
## 🌐 Live Application

### Frontend

🔗 **Live Frontend:**  
https://mini-erp-crm-lovat-eight.vercel.app/products

### Backend API

🔗 **Live Backend API:**  
https://mini-erp-crm-n6mw.onrender.com

## 📂 Project Architecture

```text
├── backend/
│   ├── prisma/             # Schema definitions and seed script
│   ├── src/                # Services, controllers, routes, middleware
│   └── tests/              # Supertest integration tests
├── frontend/
│   ├── src/
│   │   ├── components/     # Layout, Sidebar, Navbar
│   │   ├── context/        # Persistent Auth Context
│   │   ├── pages/          # Interactive dashboard, CRM, inventory, challans, admin panel
│   │   └── utils/          # Customized Axios API instance
│   └── nginx.conf          # Nginx configurations for SPA routing
├── docker-compose.yml       # Docker compose setup
└── docs/
    └── api_documentation.md # REST API Docs
```

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+)
* PostgreSQL / Neon Database URL

### Configuration
1. Create a `backend/.env` file with your postgres link:
   ```env
   DATABASE_URL="postgresql://neondb_owner:npg_zcb3DUA0sujF@ep-round-block-axr8s3l0.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"
   JWT_SECRET="opsflow-super-secure-token-secret-1234!"
   PORT=5000
   ```
2. Create a `frontend/.env` file:
   ```env
   VITE_API_URL="http://localhost:5000/api"
   ```

### Installation & Run

You can run commands directly from the **root workspace directory** using the integrated npm script shortcuts:

```bash
# 1. Install dependencies for both Frontend and Backend projects
npm run install:all

# 2. Push database schema migrations to Neon Postgres
npm run backend:migrate

# 3. Seed default operational users and initial products
npm run backend:seed

# 4. Start both Backend & Frontend dev environments concurrently
npm run dev
```

*(Alternatively, you can run commands inside the subfolders manually)*

#### Backend Setup
```bash
cd backend
npm install
npx prisma db push
npm run seed
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Role-Based Credentials (Quick Fill Buttons Integrated!)

The login screen includes shortcut buttons to instantly autofill credentials for each operational role:

| Security Role | Email | Password | Allowed Dashboards & Pages |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@opsflow.com` | `Admin@123` | Full privileges (User accounts management, Settings, CRM, Inventory adjustments, Sales Challans) |
| **SALES** | `sales@opsflow.com` | `Sales@123` | Customer CRM (Add, Edit, timelines), Sales Challans builder |
| **WAREHOUSE** | `warehouse@opsflow.com` | `Warehouse@123` | Product catalog (Specs details), Inventory adjustment ledger (IN/OUT adjustments) |
| **ACCOUNTS** | `accounts@opsflow.com` | `Accounts@123` | Customer CRM (view only), Sales Challans ledger, Reports analytical dashboard |

---

## 🐳 Docker Deployment

To launch the backend API, postgres, and nginx frontend static server containerized, run:

```bash
docker-compose up --build
```
The portal will be active on [http://localhost](http://localhost).

---

## 📸 Portal Screenshots

### 1. Operations Login Screen
Custom branding left pane and quick credential fill buttons for rapid role-based operational testing:
![Operations Login Screen](screenshots/login.png)

### 2. Dashboard Analytics (Admin View)
Interactive metrics and analytical trends powered by Recharts (displays totals, low stock alerts list, and crm followups):
![Dashboard Analytics](screenshots/dashboard.png)

### 3. Customer CRM Profile
Tracks client information and logs follow-ups on a chronological timeline ledger:
![Customer CRM Profile](screenshots/customer_profile.png)

### 4. Product Catalog
Searchable product details registry mapping available units and low stock warning triggers:
![Product Catalog](screenshots/product_catalog.png)

### 5. Warehouse Stocks Management
Direct indicators for stock warnings, out-of-stock items, and manual inventory adjustment entries:
![Warehouse Stocks Management](screenshots/inventory_status.png)

### 6. Sales Challans Registry
Delivery notes ledger with drafts and confirmed statuses details list:
![Sales Challans Registry](screenshots/challans_list.png)

### 7. Stock Movements Ledger
Chronological transaction histories tracking dispatch direction (`IN` / `OUT`), quantities, reasons, and creator references:
![Stock Movements Ledger](screenshots/stock_movements.png)

### 8. Sales Challan Details (Invoice Print View)
Printable invoice format with clean billing segments and automated print calculations (supports saving as PDF directly):
![Sales Challan Details](screenshots/challan_details.png)

