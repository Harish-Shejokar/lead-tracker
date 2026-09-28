const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: LeadStatus;
  created_at: string;
}

export interface NewLead {
  name: string;
  email: string;
  phone: string;
}

// "CONTACTED" -> "Contacted"
export function formatStatus(status: LeadStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

// Throws the API's error message when it sends one, e.g. "Email already exists"
async function parseResponse<T>(res: Response, fallbackError: string): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? fallbackError);
  }
  return res.json();
}

// Get all leads (with optional search/filter)
export async function getLeads(search?: string, status?: string): Promise<Lead[]> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (status) params.append("status", status);

  const res = await fetch(`${API_URL}/api/leads?${params}`);
  return parseResponse(res, "Failed to fetch leads");
}

// Create new lead
export async function createLead(data: NewLead): Promise<Lead> {
  const res = await fetch(`${API_URL}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseResponse(res, "Failed to create lead");
}

// Update lead status
export async function updateLeadStatus(id: number, status: LeadStatus): Promise<Lead> {
  const res = await fetch(`${API_URL}/api/leads/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return parseResponse(res, "Failed to update lead");
}
