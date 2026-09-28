"use client";

import { useState, useEffect } from "react";
import {
  Lead,
  LeadStatus,
  LEAD_STATUSES,
  NewLead,
  createLead,
  formatStatus,
  getLeads,
  updateLeadStatus,
} from "@/lib/api";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import LeadTable from "@/components/LeadTable";
import CreateLeadForm from "@/components/CreateLeadForm";

const SEARCH_DEBOUNCE_MS = 300;

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  // Bumped after a create or status update to refetch with the current filters
  const [reloadKey, setReloadKey] = useState(0);

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    // Drop responses from requests that a newer search or filter has replaced
    let ignore = false;
    setLoading(true);

    getLeads(debouncedSearch, status)
      .then((data) => {
        if (ignore) return;
        setLeads(data);
        setError("");
      })
      .catch((err) => {
        if (ignore) return;
        console.error("Error fetching leads:", err);
        setError("Could not load leads. Please try again.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [debouncedSearch, status, reloadKey]);

  // Errors are left to the form so it can show them and keep the user's input
  const handleCreateLead = async (formData: NewLead) => {
    await createLead(formData);
    setShowForm(false);
    setReloadKey((key) => key + 1);
  };

  const handleStatusUpdate = async (id: number, newStatus: LeadStatus) => {
    try {
      await updateLeadStatus(id, newStatus);
      setReloadKey((key) => key + 1);
    } catch (err) {
      console.error("Error updating lead:", err);
      setError(err instanceof Error ? err.message : "Failed to update lead");
    }
  };

  const hasFilters = Boolean(search || status);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-wrap gap-4 justify-between items-center">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Create Form */}
        {showForm && (
          <div className="mb-8 bg-gray-50 p-6 sm:p-8 rounded-lg border border-gray-200">
            <h2 className="text-xl font-bold text-black mb-6">New Lead</h2>
            <CreateLeadForm onSubmit={handleCreateLead} />
          </div>
        )}

        {/* Search & Filter */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            aria-label="Search leads"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder-gray-500"
          />
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black bg-white"
          >
            <option value="">All Statuses</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatStatus(s)}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Leads Table: kept on screen while refetching to avoid flicker */}
        {leads.length > 0 ? (
          <div className={`transition-opacity ${loading ? "opacity-60" : ""}`}>
            <LeadTable leads={leads} onStatusUpdate={handleStatusUpdate} />
          </div>
        ) : loading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-lg">Loading leads...</div>
          </div>
        ) : (
          !error && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-lg font-medium">No leads found</div>
              <p className="text-sm mt-2">
                {hasFilters
                  ? "Try a different search or status filter"
                  : "Create a new lead to get started"}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
