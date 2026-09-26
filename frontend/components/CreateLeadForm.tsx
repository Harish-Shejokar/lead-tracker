"use client";

import { useState } from "react";

interface CreateLeadFormProps {
  onSubmit: (data: { name: string; email: string; phone: string }) => void;
}

export default function CreateLeadForm({ onSubmit }: CreateLeadFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email) {
      alert("Name and email are required");
      return;
    }

    try {
      setLoading(true);
      await onSubmit({ name, email, phone });
      setName("");
      setEmail("");
      setPhone("");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-black mb-2">Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder-gray-500"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">Email *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder-gray-500"
          placeholder="john@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">Phone</label>
        <input
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