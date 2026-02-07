const API_BASE = import.meta.env.VITE_API_URL || "";

function getToken(): string | null {
  return localStorage.getItem("token");
}

export async function api<T>(
  path: string,
  options: RequestInit & { body?: object } = {}
): Promise<T> {
  const { body, ...rest } = options;
  const headers: HeadersInit = {
    ...(rest.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || String(err));
  }
  return res.json();
}

export const auth = {
  login: (email: string, password: string) =>
    api<{ access_token: string }>("/api/v1/auth/login", { method: "POST", body: { email, password } }),
  signup: (email: string, password: string, full_name: string) =>
    api<{ id: string; email: string }>("/api/v1/auth/signup", {
      method: "POST",
      body: { email, password, full_name },
    }),
};

export const businesses = {
  list: () => api<{ id: string; name: string; gstin: string }[]>("/api/v1/businesses"),
  create: (data: { name: string; gstin?: string; business_type?: string; address?: string }) =>
    api<{ id: string; name: string }>("/api/v1/businesses", { method: "POST", body: data }),
  get: (id: string) => api<{ id: string; name: string; gstin: string }>(`/api/v1/businesses/${id}`),
};

export const invoices = {
  list: (businessId?: string) =>
    api<Invoice[]>(
      businessId ? `/api/v1/invoices?business_id=${businessId}` : "/api/v1/invoices"
    ),
  get: (id: string) => api<Invoice>(`/api/v1/invoices/${id}`),
  upload: (businessId: string, file: File) => {
    const form = new FormData();
    form.append("business_id", businessId);
    form.append("file", file);
    return api<Invoice>("/api/v1/invoices", { method: "POST", body: form });
  },
  update: (id: string, data: { extracted_json?: object; status?: string }) =>
    api<Invoice>(`/api/v1/invoices/${id}`, { method: "PATCH", body: data }),
  process: (id: string) =>
    api<Invoice>(`/api/v1/invoices/${id}/process`, { method: "POST" }),
};

export interface Invoice {
  id: string;
  business_id: string;
  file_name: string;
  content_type: string;
  status: string;
  error_message: string | null;
  raw_text: string | null;
  extracted_json: Record<string, unknown>;
  processed_at: string | null;
  created_at: string;
}

export const reports = {
  pl: (businessId?: string) =>
    api<{ income: number; expenses_by_category: Record<string, number>; total_expenses: number; net: number }>(
      businessId ? `/api/v1/reports/pl?business_id=${businessId}` : "/api/v1/reports/pl"
    ),
  expenses: (businessId?: string) =>
    api<{ by_category: Record<string, number> }>(
      businessId ? `/api/v1/reports/expenses?business_id=${businessId}` : "/api/v1/reports/expenses"
    ),
};

export const gst = {
  liability: (businessId: string) =>
    api<{ output_tax: number; itc: number; tax_payable: number }>(
      `/api/v1/gst/businesses/${businessId}/liability`
    ),
  prepareGstr1: (businessId: string) =>
    api<Record<string, unknown>>("/api/v1/gst/gstr1/prepare", {
      method: "POST",
      body: { business_id: businessId },
    }),
  prepareGstr3b: (businessId: string) =>
    api<Record<string, unknown>>("/api/v1/gst/gstr3b/prepare", {
      method: "POST",
      body: { business_id: businessId },
    }),
};
