import axios from 'axios';

// Na prática isso viria de uma variável de ambiente no Vercel (ex: import.meta.env.VITE_API_URL)
export const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tipos base
export interface User {
  id: number;
  name: string;
  role: string;
  pin?: string;
}

export interface Category {
  id: number;
  name: string;
  type: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  is_active: boolean;
  stock_quantity: number;
  category_id: number;
  destination: string;
  category?: Category;
}

export interface Table {
  id: number;
  number: number;
  status: string;
  current_waiter_id?: number | null;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  observations: string | null;
  status: string;
  created_at: string;
  product: Product;
}

export interface Payment {
  id: number;
  method: string;
  amount: number;
}

export interface Order {
  id: number;
  table_id: number;
  status: string;
  created_at: string;
  items: OrderItem[];
  payments?: Payment[];
  table: Table;
}

export interface CashRegister {
  id: number;
  status: string;
  initial_balance: number;
  current_balance: number;
  opened_at: string;
  closed_at?: string;
}
