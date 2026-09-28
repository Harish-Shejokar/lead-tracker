"use client";

import { Lead, LeadStatus, LEAD_STATUSES, formatStatus } from "@/lib/api";

interface LeadTableProps {
  leads: Lead[];
  onStatusUpdate: (id: number, status: LeadStatus) => void;
}

const statusColors: Record<LeadStatus, string> = {
  NEW: "bg-gray-100 text-gray-800",
  CONTACTED: "bg-blue-50 text-blue-700",
  QUALIFIED: "bg-slate-100 text-slate-700",
  CONVERTED: "bg-green-50 text-green-700",
  LOST: "bg-red-50 text-red-700",
};

export default function LeadTable({ leads, onStatusUpdate }: LeadTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-6 py-4 text-left text-sm font-semibold text-black">Name</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-black">Email</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-black">Phone</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-black">Status</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-black">Created</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, idx) => (
            <tr
              key={lead.id}
              className={`border-b border-gray-100 transition-colors ${
                idx % 2 === 0 ? "bg-white" : "bg-gray-50"
              } hover:bg-gray-100`}
            >
              <td className="px-6 py-4 text-sm font-medium text-black">{lead.name}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{lead.email}</td>
              <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{lead.phone || "—"}</td>
              <td className="px-6 py-4 text-sm">
                <select
                  aria-label={`Status for ${lead.name}`}
                  value={lead.status}
                  onChange={(e) => onStatusUpdate(lead.id, e.target.value as LeadStatus)}
                  className={`px-3 py-2 rounded-md text-sm font-medium border-0 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer transition-all ${
                    statusColors[lead.status] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {formatStatus(s)}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                {new Date(lead.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
