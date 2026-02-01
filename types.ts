
export enum UserRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee'
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'disabled';
  createdAt: string;
}

export interface Product {
  id: string;
  _id?: string;
  name: string;
  barcode: string;
  category: string;
  subCategory?: string;
  mrp?: number;
  price: number;
  costPrice: number;
  gst: number;
  stock: number;
}

export interface Purchase {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  supplier?: string;
  createdAt: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Bill {
  id: string;
  billNo: string;
  items: {
    productId: string;
    name: string;
    qty: number;
    mrp?: number;
    price: number;
    gst: number;
  }[];
  total: number;
  gstTotal: number;
  paymentMode: 'Cash' | 'UPI';
  employeeId: string;
  employeeName: string;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
}

export interface DashboardStats {
  todaySales: number;
  monthlySales: number;
  lowStockItems: number;
  totalBillsToday: number;
}

export interface Customer {
  id: string;
  _id?: string;
  name: string;
  phone: string;
  createdAt: string;
  orderIds?: string[];
}
