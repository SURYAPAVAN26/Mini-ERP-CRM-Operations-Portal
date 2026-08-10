export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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
  created_at: string;
  recent_challans?: SalesChallan[];
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
  is_low_stock?: boolean;
  created_at: string;
  recent_movements?: StockMovement[];
}

export interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  movement_type: 'IN' | 'OUT';
  reason: string;
  created_by_name?: string;
  created_at: string;
}

export interface ChallanItem {
  id?: string;
  product_id?: string;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface SalesChallan {
  id: string;
  challan_number: string;
  customer_id: string;
  customer_name?: string;
  customer_business_name?: string;
  customer_mobile?: string;
  customer_email?: string;
  customer_address?: string;
  customer_gst?: string;
  total_quantity: number;
  total_amount: number;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  created_by_name?: string;
  created_at: string;
  items?: ChallanItem[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: Pagination;
  error?: string;
}
