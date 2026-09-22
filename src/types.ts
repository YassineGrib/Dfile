export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  social_links?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
  };
  address?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export type ProjectStatus = 'Planned' | 'In Progress' | 'Waiting Client' | 'Completed' | 'Delivered' | 'Cancelled';

export interface Project {
  id: string;
  name: string;
  description?: string;
  category: string;
  client_id: string;
  price_dzd: number;
  status: ProjectStatus;
  progress_percentage: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface TaskComment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
}

export interface Task {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  status: 'Next up' | 'In Progress' | 'Complete';
  due_date?: string;
  labels?: string[];
  assignees?: string[];
  comments?: TaskComment[];
  created_at: string;
}

export type PaymentType = 'advance' | 'milestone' | 'final' | 'tip' | 'full' | 'partial';
export type PaymentMethod = 'baridimob' | 'ccp' | 'bank_transfer' | 'cash' | 'other' | string;

export interface Payment {
  id: string;
  project_id: string;
  client_id: string;
  amount: number;
  payment_type: PaymentType;
  payment_method: PaymentMethod;
  reference_number?: string;
  notes?: string;
  payment_date: string;
  created_at: string;
}

export interface Expense {
  id: string;
  amount: number;
  project_id?: string; // Optional (General Expense if undefined)
  category: string;
  description?: string;
  expense_date: string;
  created_at: string;
}

export interface Activity {
  id: string;
  text: string;
  text_ar: string;
  type: 'project' | 'payment' | 'expense' | 'client';
  timestamp: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: 'proforma' | 'final';
  client_id: string;
  project_id: string;
  invoice_date: string;
  due_date?: string;
  total_amount: number;
  payment_method: string;
  notes?: string;
  line_items: InvoiceLineItem[];
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  created_at: string;
  updated_at?: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  date: string;
  completed: boolean;
  created_at?: string;
}

export interface Contract {
  id: string;
  title: string;
  project_id: string;
  client_id: string;
  status: 'Draft' | 'Sent' | 'Signed' | 'Completed';
  date_created: string;
  amount: number;
  content: string;
}

