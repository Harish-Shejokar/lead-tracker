const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
}

// Get all leads (with optional search/filter)
export async function getLeads(search?: string, status?: string) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (status) params.append("status", status);

  const res = await fetch(`${API_URL}/api/leads?${params}`);
  if (!res.ok) throw new Error("Failed to fetch leads");
  return res.json();
}

// Create new lead
export async function createLead(data: { name: string; email: string; phone: string }) {
  const res = await fetch(`${API_URL}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create lead");
  return res.json();
}

// Update lead status
export async function updateLeadStatus(id: number, status: string) {
  const res = await fetch(`${API_URL}/api/leads/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update lead");
  return res.json();
}