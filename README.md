# NEXUS OPERA | Wholesale ERP & CRM Operations Portal

> **Enterprise Operations Management System for Wholesale & Distribution**

NEXUS OPERA is a full-stack, production-ready ERP + CRM Operations Portal engineered for wholesale and distribution companies. It unifies customer relationship management, product catalogs, warehouse stock tracking, transactional inventory deductions, and sales challan fulfillment with strict database role security (RBAC).

---

## 🔑 Registered Employee Test Accounts

All test accounts exist pre-seeded in the database with secure bcrypt password hashes.

| Role | Email Address | Test Password | Access Level |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@nexusopera.com` | `nexusAdmin123!` | Complete System Management & Controls |
| **SALES** | `sales@nexusopera.com` | `nexusSales123!` | Customers CRM & Sales Challans |
| **WAREHOUSE** | `warehouse@nexusopera.com` | `nexusWarehouse123!` | Stock Inventory & Adjustments |
| **ACCOUNTS** | `accounts@nexusopera.com` | `nexusAccounts123!` | Customer & Challan Financial Summaries |

---

## 🔒 Security & Authentication Architecture

1. **Database-Only Authentication**: The login system strictly authenticates users registered in the database. Random/fake emails (e.g. `random@gmail.com`) are rejected with standard sanitized HTTP 401 error: `"Invalid email or password"`.
2. **Password Protection**: Passwords are saved strictly as 10-round `bcrypt` hashes. No plaintext passwords or secrets exist in the codebase.
3. **Role Authorization**: Access control is enforced on backend routes via `requireRole` middleware (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`). Frontend UI element hiding is backed by server-side verification.
4. **Environment Security**: JWT Secret and Database credentials are managed via environment variables (`.env`), which are excluded from Git repository tracking (`.gitignore`).

---

## 🚀 Key Modules & Business Logic

- **Customer CRM**: Lead vs Active client status tracking, follow-up schedule management, GSTIN recordkeeping, and follow-up history logging.
- **Product Catalog**: SKU uniqueness validation, category filtering, minimum stock alert badges, and location tracking.
- **Stock Movement Log**: Manual warehouse adjustments (`IN`/`OUT`) with reference reason logging and an immutable audit log.
- **Sales Challans & Transactional Fulfillment**: Multi-item challan creation with **Product Snapshot Storage** (`product_name`, `sku`, `unit_price`). Confirmation executes an atomic PostgreSQL transaction that checks stock levels and decrements stock only when sufficient inventory exists.

---

## 💻 Running the Portal Locally

1. **Database Initialization**: Ensure PostgreSQL is running on `localhost:5432` with database `mini_erp_crm`.
2. **Seed & Build**:
   ```bash
   cd backend
   npm install
   npm run db:seed   # Seeds users, products, customers, and challans
   npm run build

   cd ../frontend
   npm install
   npm run build
   ```
3. **Start Unified Server**:
   ```bash
   cd backend
   npm start
   ```
4. Access the unified portal at:
   - **Local Laptop**: [http://localhost:5000/](http://localhost:5000/)
   - **Network LAN Devices**: `http://10.44.3.65:5000/`
