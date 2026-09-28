"use client";

import { useState } from "react";
import { NewLead } from "@/lib/api";

interface CreateLeadFormProps {
  // Rejects with the reason when the lead could not be created
  onSubmit: (data: NewLead) => Promise<void>;
}

export default function CreateLeadForm({ onSubmit }: CreateLeadFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      setError("Name and email are required");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await onSubmit({ name, email, phone });
      setName("");
      setEmail("");
      setPhone("");
    } catch (err) {
      // Keep the input so the user can correct it and retry
      setError(err instanceof Error ? err.message : "Failed to create lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div
          role="alert"
          className="px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor="lead-name" className="block text-sm font-semibold text-black mb-2">
          Name *
        </label>
        <input
          id="lead-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder-gray-500"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label htmlFor="lead-email" className="block text-sm font-semibold text-black mb-2">
          Email *
        </label>
        <input
          id="lead-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder-gray-500"
          placeholder="john@example.com"
        />
      </div>

      <div>
        <label htmlFor="lead-phone" className="block text-sm font-semibold text-black mb-2">
          Phone
        </label>
        <input
          id="lead-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder-gray-500"
          placeholder="+1 (555) 000-0000"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black hover:bg-gray-900 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-semibold transition-colors mt-6"
      >
        {loading ? "Creating..." : "Create Lead"}
      </button>
    </form>
  );
}
