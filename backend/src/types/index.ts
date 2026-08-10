import { Request } from 'express';

export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_email_verified?: boolean;
  otp_code?: string | null;
  otp_expires_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  business_name: string;
  gst_number?: string | null;
  customer_type: 'Retail' | 'Wholesale' | 'Distributor';
  address: string;
  status: 'Lead' | 'Active' | 'Inactive';
  follow_up_date?: string | null;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  min_stock_alert: number;
  location: string;
  created_at: Date;
  updated_at: Date;
}

export interface StockMovement {
  id: string;
  product_id: string;
  quantity: number;
  movement_type: 'IN' | 'OUT';
  reason: string;
  created_by?: string | null;
  created_at: Date;
  // joined fields
  product_name?: string;
  sku?: string;
  created_by_name?: string;
}

export interface SalesChallan {
  id: string;
  challan_number: string;
  customer_id: string;
  total_quantity: number;
  total_amount: number;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  created_by?: string | null;
  created_at: Date;
  updated_at: Date;
  // joined fields
  customer_name?: string;
  created_by_name?: string;
  items?: ChallanItem[];
}

export interface ChallanItem {
  id: string;
  challan_id: string;
  product_id?: string | null;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}
