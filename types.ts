// Fix: Define all application-wide TypeScript types.
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  supplierId: string;
  stock: number;
  lowStockThreshold: number;
  costPrice: number;
  sellingPrice: number;
  image?: string;
  description?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
}

export interface SaleItem {
  productId: string;
  quantity: number;
  price: number;
  costPrice: number;
}

export interface Sale {
  id: string;
  date: string; // ISO string
  items: SaleItem[];
  total: number;
  customerName: string;
  customerPhone: string;
  paymentMethod: 'cash' | 'card';
  clientId?: string; // Link to the client table
  origin: 'pos' | 'online'; // Where the sale was made
  status?: 'completed' | 'cancelled';
}

export interface PurchaseItem {
  productId: string;
  quantity: number;
  cost: number;
}

export interface Purchase {
  id: string;
  date: string; // ISO string
  supplierId: string;
  items: PurchaseItem[];
  total: number;
  status: 'pending' | 'received';
}

export interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
}

export interface OnlineOrder {
    id: string;
    date: string; // ISO string
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    items: CartItem[];
    total: number;
    status: 'pending' | 'paid' | 'shipped';
}

export interface Category {
  id: string;
  name: string;
}

export interface Client {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  dni: string;
}

export interface StockHistory {
  id: string;
  productId: string;
  date: string; // ISO string
  type: 'sale' | 'purchase' | 'manual_adjustment' | 'initial_stock' | 'sale_cancellation';
  quantityChange: number; // e.g., -2 for a sale, +10 for a purchase
  newStockLevel: number;
  notes?: string; // e.g., "Sale ID: sale-123", "Purchase ID: purch-456"
}