import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLead, getLeads, updateLeadStatus } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue({ ok: true, json: async () => [] });
});

describe("getLeads", () => {
  it("requests all leads when no filters are given", async () => {
    await getLeads();

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/api/leads?`);
  });

  it("sends search and status as query parameters", async () => {
    await getLeads("john doe", "CONTACTED");

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_URL}/api/leads?search=john+doe&status=CONTACTED`
    );
  });

  it("returns the leads from the response", async () => {
    const leads = [{ id: 1, name: "John Doe" }];
    fetchMock.mockResolvedValue({ ok: true, json: async () => leads });

    await expect(getLeads()).resolves.toEqual(leads);
  });

  it("throws when the request fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });

    await expect(getLeads()).rejects.toThrow("Failed to fetch leads");
  });
});

describe("createLead", () => {
  it("POSTs the lead as JSON", async () => {
    const lead = { name: "John Doe", email: "john@example.com", phone: "9876543210" };

    await createLead(lead);

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
  });

  it("throws when the request fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });

    await expect(
      createLead({ name: "John Doe", email: "john@example.com", phone: "" })
    ).rejects.toThrow("Failed to create lead");
  });
});

describe("updateLeadStatus", () => {
  it("PATCHes the new status for the lead", async () => {
    await updateLeadStatus(7, "QUALIFIED");

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/api/leads/7/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "QUALIFIED" }),
    });
  });

  it("throws when the request fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });

    await expect(updateLeadStatus(7, "LOST")).rejects.toThrow("Failed to update lead");
  });
});
