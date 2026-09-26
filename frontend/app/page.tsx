"use client";

import { useState, useEffect } from "react";
import { Lead, getLeads, createLead, updateLeadStatus } from "@/lib/api";
import LeadTable from "@/components/LeadTable";
import CreateLeadForm from "@/components/CreateLeadForm";

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, [search, status]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await getLeads(search, status);
      setLeads(data);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (formData: { name: string; email: string; phone: string }) => {
    try {
      await createLead(formData);
      setShowForm(false);
      fetchLeads();
    } catch (error) {
      console.error("Error creating lead:", error);
      alert("Failed to create lead");
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      await updateLeadStatus(id, newStatus);
      fetchLeads();
    } catch (error) {
      console.error("Error updating lead:", error);
      alert("Failed to update lead");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-black text-black tracking-tight">Lead Tracker</h1>
              <p className="text-gray-600 mt-1 text-sm">Manage and track your sales leads</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-black hover:bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {showForm ? "Cancel" : "+ Create Lead"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Create Form */}
        {showForm && (
          <div className="mb-8 bg-gray-50 p-8 rounded-lg border border-gray-200">
            <h2 className="text-xl font-bold text-black mb-6">New Lead</h2>
            <CreateLeadForm onSubmit={handleCreateLead} />
          </div>
        )}

        {/* Search & Filter */}
        <div className="mb-8 flex gap-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder-gray-500"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black bg-white"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="CONVERTED">Converted</option>
            <option value="LOST">Lost</option>
          </select>
        </div>

        {/* Leads Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-lg">Loading leads...</div>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-lg font-medium">No leads found</div>
            <p className="text-sm mt-2">Create a new lead to get started</p>
          </div>
        ) : (
          <LeadTable leads={leads} onStatusUpdate={handleStatusUpdate} />
        )}
      </div>
    </div>
  );
}