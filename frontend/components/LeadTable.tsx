"use client";

import { Lead } from "@/lib/api";

interface LeadTableProps {
  leads: Lead[];
  onStatusUpdate: (id: number, status: string) => void;
}

const statusColors: Record<string, string> = {
  NEW: "bg-gray-100 text-gray-800",
  CONTACTED: "bg-blue-50 text-blue-700",
  QUALIFIED: "bg-slate-100 text-slate-700",
  CONVERTED: "bg-green-50 text-green-700",
  LOST: "bg-red-50 text-red-700",
};

export default function LeadTable({ leads, onStatusUpdate }: LeadTableProps) {
  const statuses = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"];

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
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
              <td className="px-6 py-4 text-sm text-gray-600">{lead.phone || "—"}</td>
              <td className="px-6 py-4 text-sm">
                <select
                  value={lead.status}
                  onChange={(e) => onStatusUpdate(lead.id, e.target.value)}
                  className={`px-3 py-2 rounded-md text-sm font-medium border-0 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer transition-all ${
                    statusColors[lead.status] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
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