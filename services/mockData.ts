
import { User, UserRole, Product, Bill, DashboardStats, Purchase } from '../types';

const PRODUCTS_KEY = 'bg_products';
const BILLS_KEY = 'bg_bills';
const USERS_KEY = 'bg_users';
const PURCHASES_KEY = 'bg_purchases';

const initialProducts: Product[] = [
  { id: '1', name: 'Aashirvaad Atta 5kg', barcode: '89017251', category: 'Flour', price: 280, costPrice: 240, gst: 5, stock: 50 },
  { id: '2', name: 'Tata Salt 1kg', barcode: '89011381', category: 'Spices', price: 28, costPrice: 22, gst: 0, stock: 100 },
  { id: '3', name: 'Maggi Noodles 4-Pack', barcode: '89010581', category: 'Snacks', price: 60, costPrice: 52, gst: 12, stock: 12 },
  { id: '4', name: 'Amul Butter 100g', barcode: '89012621', category: 'Dairy', price: 56, costPrice: 48, gst: 12, stock: 5 },
];

const initialUsers: User[] = [
  { id: 'admin_1', name: 'Shop Owner', email: 'admin@example.com', role: UserRole.ADMIN, status: 'active', createdAt: new Date().toISOString() },
  { id: 'emp_1', name: 'Rajesh Kumar', email: 'rajesh@example.com', role: UserRole.EMPLOYEE, status: 'active', createdAt: new Date().toISOString() }
];

// Products
export const getProducts = (): Product[] => {
  const data = localStorage.getItem(PRODUCTS_KEY);
  return data ? JSON.parse(data) : initialProducts;
};

export const saveProduct = (product: Product) => {
  const products = getProducts();
  const index = products.findIndex(p => p.id === product.id);
  if (index > -1) {
    products[index] = product;
  } else {
    products.push({ ...product, id: Date.now().toString() });
  }
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};

export const deleteProduct = (id: string) => {
  const products = getProducts().filter(p => p.id !== id);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};

// Purchases
export const logPurchase = (purchase: Omit<Purchase, 'id' | 'createdAt'>) => {
  const purchases = getPurchases();
  const products = getProducts();
  const newPurchase = { ...purchase, id: Date.now().toString(), createdAt: new Date().toISOString() };
  
  // Update Product Stock
  const updatedProducts = products.map(p => 
    p.id === purchase.productId ? { ...p, stock: p.stock + purchase.quantity, costPrice: purchase.unitCost } : p
  );

  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));
  localStorage.setItem(PURCHASES_KEY, JSON.stringify([newPurchase, ...purchases]));
};

export const getPurchases = (): Purchase[] => {
  const data = localStorage.getItem(PURCHASES_KEY);
  return data ? JSON.parse(data) : [];
};

// Users
export const getUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : initialUsers;
};

export const saveUser = (user: User) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index > -1) {
    users[index] = user;
  } else {
    users.push({ ...user, id: Date.now().toString(), createdAt: new Date().toISOString() });
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Bills
export const createBill = (billData: Omit<Bill, 'id' | 'billNo' | 'createdAt'>): Bill => {
  const bills = getBills();
  const products = getProducts();
  
  const newBill: Bill = {
    ...billData,
    id: Date.now().toString(),
    billNo: `INV-${1000 + bills.length + 1}`,
    createdAt: new Date().toISOString()
  };

  const updatedProducts = products.map(p => {
    const billItem = billData.items.find(item => item.productId === p.id);
    if (billItem) return { ...p, stock: p.stock - billItem.qty };
    return p;
  });

  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));
  localStorage.setItem(BILLS_KEY, JSON.stringify([newBill, ...bills]));
  return newBill;
};

export const getBills = (): Bill[] => {
  const data = localStorage.getItem(BILLS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getDashboardStats = (): DashboardStats => {
  const bills = getBills();
  const products = getProducts();
  const today = new Date().toLocaleDateString();
  
  const todayBills = bills.filter(b => new Date(b.createdAt).toLocaleDateString() === today);
  const monthBills = bills.filter(b => new Date(b.createdAt).getMonth() === new Date().getMonth());

  return {
    todaySales: todayBills.reduce((acc, curr) => acc + curr.total, 0),
    monthlySales: monthBills.reduce((acc, curr) => acc + curr.total, 0),
    lowStockItems: products.filter(p => p.stock < 10).length,
    totalBillsToday: todayBills.length
  };
};
