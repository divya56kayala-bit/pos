
import { User, Product, Bill, DashboardStats, Customer } from '../types';

// Ensure API_BASE always ends with /api for consistency
const getApiBase = () => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return base.endsWith('/api') ? base : `${base}/api`;
};

const API_BASE = getApiBase();

const getHeaders = () => {
  const auth = localStorage.getItem('bg_auth_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${auth}`
  };
};

export const api = {
  login: async (email: string, password: string) => {
    // Explicitly use /api/auth/login to match backend mount
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  getProducts: async (): Promise<Product[]> => {
    const res = await fetch(`${API_BASE}/products`, { headers: getHeaders() });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
      throw new Error('Failed to fetch products');
    }
    return res.json();
  },

  getProductByBarcode: async (barcode: string): Promise<Product | null> => {
    const res = await fetch(`${API_BASE}/products/barcode/${barcode}`, { headers: getHeaders() });
    if (res.status === 404) return null;
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
      throw new Error('Failed to fetch product');
    }
    return res.json();
  },

  saveProduct: async (product: any) => {
    const method = product._id ? 'PUT' : 'POST';
    const url = product._id ? `${API_BASE}/products/${product._id}` : `${API_BASE}/products`;
    const res = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(product)
    });
    return res.json();
  },

  createBill: async (billData: any) => {
    const res = await fetch(`${API_BASE}/bills`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(billData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Billing failed');
    }
    return res.json();
  },

  getBills: async (): Promise<Bill[]> => {
    const res = await fetch(`${API_BASE}/bills`, { headers: getHeaders() });
    return res.json();
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await fetch(`${API_BASE}/reports/summary`, { headers: getHeaders() });
    return res.json();
  },

  getAnalytics: async (range: number = 30): Promise<any> => {
    const res = await fetch(`${API_BASE}/reports/analytics?range=${range}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  getUsers: async (): Promise<User[]> => {
    const res = await fetch(`${API_BASE}/auth/users`, { headers: getHeaders() });
    if (!res.ok) {
      // If unauthorized/forbidden, return empty array to prevent crash
      if (res.status === 403 || res.status === 401) return [];
      throw new Error('Failed to fetch users');
    }
    return res.json();
  },

  registerUser: async (userData: any) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    return res.json();
  },

  deleteProduct: async (id: string) => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete product');
    return res.json();
  },

  getCustomerByPhone: async (phone: string) => {
    const res = await fetch(`${API_BASE}/customers/phone/${phone}`, { headers: getHeaders() });
    if (res.status === 404) return null; // Expected if customer doesn't exist
    if (!res.ok) throw new Error('Failed to fetch customer');
    return res.json();
  },

  getAllCustomers: async (): Promise<Customer[]> => {
    const res = await fetch(`${API_BASE}/customers`, { headers: getHeaders() });
    if (!res.ok) {
      if (res.status === 403) throw new Error('Access Denied');
      throw new Error('Failed to fetch customers');
    }
    return res.json();
  },

  getCustomerOrders: async (phone: string): Promise<Bill[]> => {
    const res = await fetch(`${API_BASE}/customers/${phone}/orders`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  getCategories: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/categories`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  createCategory: async (category: any) => {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(category)
    });
    if (!res.ok) throw new Error('Failed to create category');
    return res.json();
  },

  updateCategory: async (id: string, category: any) => {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(category)
    });
    if (!res.ok) throw new Error('Failed to update category');
    return res.json();
  },

  deleteCategory: async (id: string) => {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete category');
    return res.json();
  }
};
