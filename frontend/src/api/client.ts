import axios, { AxiosError } from "axios";
import { toast } from "@/components/ui/toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: API_TIMEOUT,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string }>) => {
    const message = error.response?.data?.detail || error.message || "An error occurred";
    
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      toast({ title: "Session expired", description: "Please login again", variant: "error" });
    } else {
      toast({ title: "Error", description: message, variant: "error" });
    }
    
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  signup: async (data: { email: string; password: string; full_name: string }) => {
    const response = await api.post("/auth/signup", data);
    return response.data;
  },
  login: async (data: { email: string; password: string }) => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },
};

// Businesses
export interface Business {
  id: string;
  name: string;
  gstin?: string;
  business_type?: string;
  address?: string;
  user_id?: string;
  created_at?: string;
}

export const businessApi = {
  getAll: async (): Promise<Business[]> => {
    const response = await api.get("/businesses");
    return response.data;
  },
  getById: async (id: string): Promise<Business> => {
    const response = await api.get(`/businesses/${id}`);
    return response.data;
  },
  create: async (data: Partial<Business>): Promise<Business> => {
    const response = await api.post("/businesses", data);
    return response.data;
  },
};

// Invoices
export type InvoiceStatus = "UPLOADED" | "PROCESSING" | "EXTRACTED" | "NEEDS_REVIEW" | "FAILED";

export interface InvoiceLineItem {
  id?: string;
  description: string;
  hsn_sac: string;
  gst_rate: number;
  qty: number;
  rate: number;
  taxable_value: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  total?: number;
}

export interface Invoice {
  id: string;
  business_id: string;
  file_name: string;
  content_type?: string;
  status: InvoiceStatus;
  error_message?: string;
  raw_text?: string;
  extracted_json?: Record<string, unknown>;
  processed_at?: string;
  created_at: string;
  is_corrected?: boolean;
}

export const invoiceApi = {
  getAll: async (params?: { business_id?: string }): Promise<Invoice[]> => {
    const response = await api.get("/invoices", { params });
    return response.data;
  },
  getById: async (id: string): Promise<Invoice> => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },
  upload: async (businessId: string, file: File): Promise<Invoice> => {
    const formData = new FormData();
    formData.append("business_id", businessId);
    formData.append("file", file);
    const response = await api.post("/invoices", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000, // 2 min - OCR + LLM can take 30–60s
    });
    return response.data;
  },
  update: async (id: string, data: { extracted_json?: Record<string, unknown>; status?: InvoiceStatus; is_corrected?: boolean }): Promise<Invoice> => {
    const response = await api.patch(`/invoices/${id}`, data);
    return response.data;
  },
  updateLineItem: async (id: string, lineItems: InvoiceLineItem[]): Promise<Invoice> => {
    const response = await api.patch(`/invoices/${id}`, {
      extracted_json: { line_items: lineItems },
      is_corrected: true
    });
    return response.data;
  },
  process: async (id: string): Promise<Invoice> => {
    const response = await api.post(`/invoices/${id}/process`, undefined, {
      timeout: 120000, // 2 min - OCR + LLM can take 30–60s
    });
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/invoices/${id}`);
  },
};

// Reports
export interface PLReport {
  period_start: string;
  period_end: string;
  total_income: number;
  total_expenses: number;
  net_profit: number;
}

export interface ExpenseReport {
  category: string;
  total: number;
  count: number;
  gst_total: number;
}

export const reportApi = {
  getPL: async (params?: { business_id?: string; period_start?: string; period_end?: string }): Promise<PLReport> => {
    const response = await api.get("/reports/pl", { params });
    const d = response.data as { income?: number; total_expenses?: number; net?: number; period_start?: string; period_end?: string };
    return {
      period_start: d.period_start ?? params?.period_start ?? new Date().toISOString().split('T')[0],
      period_end: d.period_end ?? params?.period_end ?? new Date().toISOString().split('T')[0],
      total_income: d.income ?? 0,
      total_expenses: d.total_expenses ?? 0,
      net_profit: d.net ?? 0,
    };
  },
  getExpenses: async (params?: { business_id?: string }): Promise<ExpenseReport[]> => {
    const response = await api.get("/reports/expenses", { params });
    const d = response.data as { by_category?: Record<string, number> };
    const byCat = d.by_category || {};
    return Object.entries(byCat).map(([category, total]) => ({
      category,
      total: Number(total) || 0,
      count: 0,
      gst_total: 0,
    }));
  },
};

// GST
export interface GSTLiability {
  business_id: string;
  output_tax: number;
  itc: number;
  tax_payable: number;
}

export interface GSTSummary {
  total_sales: number;
  total_purchases: number;
  output_gst: number;
  input_gst: number;
  net_gst_payable: number;
  period_month: string;
}

export interface VendorGST {
  vendor_name: string;
  vendor_gstin?: string;
  total_purchase: number;
  gstin_missing: boolean;
  gstin_invalid: boolean;
  percentage_share: number;
}

export interface ITCSummary {
  total_itc: number;
  risk_flagged_vendors: {
    vendor_name: string;
    issue: string;
    amount: number;
  }[];
}

export interface ProjectedGSTAlert {
  current_month_liability: number;
  previous_month_liability: number;
  percentage_increase: number;
  is_warning: boolean;
}

export const gstApi = {
  getLiability: async (businessId: string): Promise<GSTLiability> => {
    const response = await api.get(`/gst/businesses/${businessId}/liability`);
    return response.data;
  },
  getSummary: async (businessId: string, month?: string): Promise<GSTSummary> => {
    const response = await api.get(`/gst/summary`, { params: { business_id: businessId, month } });
    return response.data;
  },
  getVendors: async (businessId: string, month?: string): Promise<VendorGST[]> => {
    const response = await api.get(`/gst/vendors`, { params: { business_id: businessId, month } });
    return response.data;
  },
  getITC: async (businessId: string, month?: string): Promise<ITCSummary> => {
    const response = await api.get(`/gst/itc`, { params: { business_id: businessId, month } });
    return response.data;
  },
  prepareGSTR1: async (businessId: string, period?: string): Promise<Record<string, unknown>> => {
    const response = await api.post("/gst/gstr1/prepare", { business_id: businessId, period });
    return response.data;
  },
  prepareGSTR3B: async (businessId: string, period?: string): Promise<Record<string, unknown>> => {
    const response = await api.post("/gst/gstr3b/prepare", { business_id: businessId, period });
    return response.data;
  },
  exportCAPack: async (businessId: string, month: string): Promise<Blob> => {
    const response = await api.get(`/gst/export/ca-pack`, { 
      params: { business_id: businessId, month },
      responseType: 'blob'
    });
    return response.data;
  },
};

// Health
export const healthApi = {
  check: async (): Promise<{ status: string }> => {
    const response = await api.get("/health");
    return response.data;
  },
};

export default api;
