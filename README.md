# Mini ERP + CRM Operations Portal

> **Full-Stack Enterprise Wholesale & Distribution Operations Management System**

A robust, production-ready Mini ERP + CRM Operations Portal engineered for wholesale and distribution companies. The portal streamlines customer relationships, product catalogs, warehouse stock tracking, transactional inventory deductions, and sales challan fulfillment with strict role-based access control (RBAC).

---

## 🚀 Technical Stack

- **Backend**: Node.js, Express.js, TypeScript, PostgreSQL (`pg` Connection Pool), JWT Authentication, bcrypt password hashing, Zod input validation, REST APIs.
- **Frontend**: React 18, TypeScript, Vite, Vanilla CSS (Enterprise Design System with dark/light themes, glassmorphism, responsive layouts, micro-animations), Axios, Lucide React Icons.
- **Database**: PostgreSQL 18 with ACID transactions, foreign keys, `pgcrypto` UUID generation, check constraints, and performance indexes.

---

## 💼 Key Business Modules & Features

### 1. Authentication & Role-Based Security (RBAC)
- Password security with `bcrypt` (10 salt rounds).
- JWT token authentication (`Bearer` headers) with 24-hour expiration.
- Dual-layer RBAC: Backend route middleware (`authenticateToken`, `requireRole`) and frontend conditional UI rendering.
- Role Access Matrix:
  - **`ADMIN`**: Complete access across all system modules, settings, inventory, users, and challans.
  - **`SALES`**: Customer CRM (CRUD, Follow-up Notes), Product Viewing, Sales Challans (Generate Draft, Confirm, Cancel, View), Dashboard.
  - **`WAREHOUSE`**: Product Catalog (CRUD), Inventory Levels, Stock Adjustments (IN movements), Stock Movement History, Customer Viewing, Dashboard.
  - **`ACCOUNTS`**: Customer Viewing, Sales Challan Viewing (Financial Summaries), Dashboard Reports.

### 2. Customer CRM Module
- Fields: Contact Name, Mobile, Email, Business Name, GST Number (Optional), Customer Type (`Retail`, `Wholesale`, `Distributor`), Billing/Delivery Address, Status (`Lead`, `Active`, `Inactive`), Follow-up Date, Notes.
- Paginated search and filtering by customer status, business name, or type.
- View customer profile with complete purchase history and interactive follow-up note logging.

### 3. Product & Inventory Management Module
- Product fields: Product Name, SKU (Unique), Category, Unit Price, Current Stock, Minimum Stock Alert Threshold, Warehouse Location.
- Low-stock visual alert badges when `current_stock <= min_stock_alert`.
- Manual Stock Adjustment (`IN` / `OUT`) with mandatory reference reason logging.
- Immutable Stock Movement Audit Log tracking timestamp, product, quantity, type, reason, and user ID.

### 4. Sales Challan Module & Transactional Business Logic
- Multi-item sales challan generation with dynamic subtotal and quantity calculation.
- **Product Snapshot Storage**: Challan items store immutable historical product snapshot values (`product_name`, `sku`, `unit_price`, `quantity`, `subtotal`) so future price or catalog changes do not alter historical records.
- **Atomic Confirmation Logic (`POST /api/challans/:id/confirm`)**:
  1. Opens a **PostgreSQL Database Transaction** (`BEGIN TRANSACTION`).
  2. Locks product rows (`SELECT ... FOR UPDATE`).
  3. Validates stock for ALL items in the challan.
  4. If stock is insufficient for ANY product:
     - Rolls back transaction (`ROLLBACK`).
     - Returns HTTP 400 with `{ success: false, message: "Insufficient stock for product: <Name>", error: "INSUFFICIENT_STOCK" }`.
     - Stock levels remain completely untouched (No partial updates or negative stock).
  5. If stock is sufficient:
     - Decrements product stock.
     - Inserts `OUT` stock movement records.
     - Updates challan status to `CONFIRMED`.
     - Commits transaction (`COMMIT`).

### 5. Interactive Operational Dashboard
- Real-time backend metrics: Total Customers (Active vs Leads), Total Products, Low-Stock Item Count, Draft vs Confirmed Sales Challans, Revenue Valuations.
- Interactive tables for Low-Stock alerts, Recent Challans, and Stock Movements.

---

## 🔑 Test Credentials (Immediate Access)

All test accounts use password: `admin123` / `sales123` / `warehouse123` / `accounts123`.

| Role | Email Address | Password | Focus Area |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@company.com` | `admin123` | Full System Access |
| **SALES** | `sales@company.com` | `sales123` | Customers CRM & Sales Challans |
| **WAREHOUSE** | `warehouse@company.com` | `warehouse123` | Stock & Inventory Adjustments |
| **ACCOUNTS** | `accounts@company.com` | `accounts123` | Financial Summaries & Read-only Views |

---

## 🗄️ Database Schema & Architecture

```
                                  +-------------------+
                                  |       users       |
                                  +---------+---------+
                                            | 1
                                            |
                                            | N
  +-------------------+ 1    N   +----------+--------+   N    1   +-------------------+
  |     customers     +----------+   sales_challans  +------------+     products      |
  +-------------------+          +----------+--------+            +---------+---------+
                                            | 1                             | 1
                                            |                               |
                                            | N                             | N
                                 +----------+--------+            +---------+---------+
                                 |   challan_items   |            |  stock_movements  |
                                 +-------------------+            +-------------------+
```

---

## 📁 Repository Directory Structure

```
Mini ERP + CRM Operations Portal/
├── backend/
│   ├── src/
│   │   ├── config/          # Database pool & Environment configuration
│   │   ├── controllers/     # API request handlers (Auth, Customer, Product, Inventory, Challan, Dashboard)
│   │   ├── db/              # SQL schema definition & DB seed script
│   │   ├── middleware/      # JWT Auth, Role Enforcement, Zod Validation, Error Handler
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Business logic & PostgreSQL Transaction Services
│   │   ├── types/           # TypeScript interfaces & types
│   │   ├── app.ts           # Express App setup
│   │   └── server.ts        # Server entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components & badges
│   │   ├── context/         # AuthContext provider
│   │   ├── layouts/         # DashboardLayout (Sidebar & Top Navigation)
│   │   ├── pages/           # Application views (Login, Dashboard, Customers, Products, Inventory, Challans)
│   │   ├── services/        # Axios API service
│   │   ├── types/           # Frontend TypeScript types
│   │   ├── App.tsx          # React Router definition
│   │   ├── index.css        # Enterprise Design System
│   │   └── main.tsx         # Entry point
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
├── postman_collection.json  # Complete Postman API collection
├── README.md
```

---

## ⚙️ Environment Variables Setup

### Backend `.env` (`backend/.env`):
```env
PORT=5000
DATABASE_URL=postgresql://postgres:1234@localhost:5432/mini_erp_crm
JWT_SECRET=super_secret_jwt_key_mini_erp_crm_2026
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env` (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 How to Run Locally

### 1. Database Setup
Make sure PostgreSQL service is running on `localhost:5432`.
Create the database:
```sql
CREATE DATABASE mini_erp_crm;
```

### 2. Backend Setup & Seeding
```bash
cd backend
npm install
npm run db:seed    # Runs schema.sql and seeds initial accounts, customers, products & challans
npm run dev        # Starts server on http://localhost:5000
```

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev        # Starts Vite React app on http://localhost:5173
```

---

## 🧪 Integration & Transactional Verification

Run the included automated integration test script to verify end-to-end flows:
```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\ksury\.gemini\antigravity-ide\brain\0e081287-78a9-4d7e-ad97-ac5c0c28e3e1\scratch\test_flow.ps1"
```

---

## 🌐 Deployment Guidelines

- **Frontend**: Deployable to Render Static Site, Vercel, or Netlify (`npm run build`). Set `VITE_API_URL` environment variable.
- **Backend**: Deployable to Render, Railway, or Fly.io (`npm run build && npm start`). Set `DATABASE_URL` and `JWT_SECRET`.
- **Database**: Host on Neon Tech, Render PostgreSQL, or Supabase PostgreSQL instance.

---

## 💡 Key Design Assumptions & Decisions

1. **Role Enforcement**: Authorization is strictly enforced at the backend REST API level. Even if a user manually triggers an API endpoint, missing role permissions result in a `403 Forbidden` response.
2. **Stock Reservation**: Stock is deducted upon Challan **CONFIRMATION**, not during Draft creation. Cancelling a confirmed challan safely restores stock and logs an `IN` movement entry.
3. **Product Snapshots**: Historical challans store product names and prices at the time of creation to guarantee historical accuracy.
