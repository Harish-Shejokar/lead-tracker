import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";
import { Lead, createLead, getLeads, updateLeadStatus } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  getLeads: vi.fn(),
  createLead: vi.fn(),
  updateLeadStatus: vi.fn(),
}));

const leads: Lead[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    phone: "9876543210",
    status: "NEW",
    created_at: "2026-09-25T12:00:00Z",
  },
];

beforeEach(() => {
  vi.mocked(getLeads).mockResolvedValue(leads);
  vi.mocked(createLead).mockResolvedValue(leads[0]);
  vi.mocked(updateLeadStatus).mockResolvedValue(leads[0]);
});

describe("Lead Tracker page", () => {
  it("loads and lists leads on first render", async () => {
    render(<Home />);

    await screen.findByText("John Doe");
    expect(getLeads).toHaveBeenCalledWith("", "");
  });

  it("shows an empty state when there are no leads", async () => {
    vi.mocked(getLeads).mockResolvedValue([]);
    render(<Home />);

    await screen.findByText("No leads found");
  });

  it("searches leads as the user types", async () => {
    render(<Home />);
    await screen.findByText("John Doe");

    await userEvent.type(screen.getByPlaceholderText("Search by name or email..."), "jane");

    await waitFor(() => expect(getLeads).toHaveBeenLastCalledWith("jane", ""));
  });

  it("filters leads by status", async () => {
    render(<Home />);
    await screen.findByText("John Doe");

    await userEvent.selectOptions(screen.getByDisplayValue("All Statuses"), "CONTACTED");

    await waitFor(() => expect(getLeads).toHaveBeenLastCalledWith("", "CONTACTED"));
  });

  it("creates a lead, hides the form and refreshes the list", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await screen.findByText("John Doe");

    await user.click(screen.getByRole("button", { name: "+ Create Lead" }));
    await user.type(screen.getByPlaceholderText("John Doe"), "Jane Foster");
    await user.type(screen.getByPlaceholderText("john@example.com"), "jane@example.com");
    await user.click(screen.getByRole("button", { name: "Create Lead" }));

    expect(createLead).toHaveBeenCalledWith({
      name: "Jane Foster",
      email: "jane@example.com",
      phone: "",
    });
    await waitFor(() => expect(screen.queryByText("New Lead")).toBeNull());
    expect(getLeads).toHaveBeenCalledTimes(2);
  });

  it("updates a lead's status from the table and refreshes the list", async () => {
    render(<Home />);
    const row = (await screen.findByText("John Doe")).closest("tr")!;

    await userEvent.selectOptions(within(row).getByRole("combobox"), "QUALIFIED");

    expect(updateLeadStatus).toHaveBeenCalledWith(1, "QUALIFIED");
    await waitFor(() => expect(getLeads).toHaveBeenCalledTimes(2));
  });
});
