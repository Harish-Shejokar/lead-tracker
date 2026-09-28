import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";
import { Lead, createLead, getLeads, updateLeadStatus } from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  getLeads: vi.fn(),
  createLead: vi.fn(),
  updateLeadStatus: vi.fn(),
}));

const john: Lead = {
  id: 1,
  name: "John Doe",
  email: "john@example.com",
  phone: "9876543210",
  status: "NEW",
  created_at: "2026-09-25T12:00:00Z",
};

const jane: Lead = {
  id: 2,
  name: "Jane Foster",
  email: "jane@example.com",
  phone: null,
  status: "CONTACTED",
  created_at: "2026-09-24T12:00:00Z",
};

beforeEach(() => {
  vi.mocked(getLeads).mockResolvedValue([john]);
  vi.mocked(createLead).mockResolvedValue(jane);
  vi.mocked(updateLeadStatus).mockResolvedValue(john);
  vi.spyOn(console, "error").mockImplementation(() => {});
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
    screen.getByText("Create a new lead to get started");
  });

  it("shows an error instead of the empty state when leads cannot be loaded", async () => {
    vi.mocked(getLeads).mockRejectedValue(new Error("Failed to fetch leads"));
    render(<Home />);

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Could not load leads. Please try again."
    );
    expect(screen.queryByText("No leads found")).toBeNull();
  });

  it("searches once the user stops typing", async () => {
    render(<Home />);
    await screen.findByText("John Doe");

    await userEvent.type(screen.getByLabelText("Search leads"), "jane");

    await waitFor(() => expect(getLeads).toHaveBeenLastCalledWith("jane", ""));
    // One request for the first load and one for the finished search term, not one per key
    expect(getLeads).toHaveBeenCalledTimes(2);
  });

  it("filters leads by status", async () => {
    render(<Home />);
    await screen.findByText("John Doe");

    await userEvent.selectOptions(screen.getByLabelText("Filter by status"), "CONTACTED");

    await waitFor(() => expect(getLeads).toHaveBeenLastCalledWith("", "CONTACTED"));
  });

  it("ignores a slow response that a newer filter has replaced", async () => {
    let resolveFirstRequest: (leads: Lead[]) => void = () => {};
    vi.mocked(getLeads)
      .mockImplementationOnce(() => new Promise((resolve) => (resolveFirstRequest = resolve)))
      .mockResolvedValueOnce([jane]);
    render(<Home />);

    await userEvent.selectOptions(screen.getByLabelText("Filter by status"), "CONTACTED");
    await screen.findByText("Jane Foster");
    await act(async () => resolveFirstRequest([john]));

    screen.getByText("Jane Foster");
    expect(screen.queryByText("John Doe")).toBeNull();
  });

  it("creates a lead, hides the form and refreshes the list", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await screen.findByText("John Doe");

    await user.click(screen.getByRole("button", { name: "+ Create Lead" }));
    await user.type(screen.getByLabelText(/^name/i), "Jane Foster");
    await user.type(screen.getByLabelText(/^email/i), "jane@example.com");
    await user.click(screen.getByRole("button", { name: "Create Lead" }));

    expect(createLead).toHaveBeenCalledWith({
      name: "Jane Foster",
      email: "jane@example.com",
      phone: "",
    });
    await waitFor(() => expect(screen.queryByText("New Lead")).toBeNull());
    expect(getLeads).toHaveBeenCalledTimes(2);
  });

  it("keeps the form open with the API error when creating fails", async () => {
    vi.mocked(createLead).mockRejectedValue(new Error("Email already exists"));
    const user = userEvent.setup();
    render(<Home />);
    await screen.findByText("John Doe");

    await user.click(screen.getByRole("button", { name: "+ Create Lead" }));
    await user.type(screen.getByLabelText(/^name/i), "John Again");
    await user.type(screen.getByLabelText(/^email/i), "john@example.com");
    await user.click(screen.getByRole("button", { name: "Create Lead" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Email already exists");
    screen.getByText("New Lead");
    expect(screen.getByLabelText<HTMLInputElement>(/^name/i).value).toBe("John Again");
  });

  it("updates a lead's status from the table and refreshes the list", async () => {
    render(<Home />);
    await screen.findByText("John Doe");

    await userEvent.selectOptions(screen.getByLabelText("Status for John Doe"), "QUALIFIED");

    expect(updateLeadStatus).toHaveBeenCalledWith(1, "QUALIFIED");
    await waitFor(() => expect(getLeads).toHaveBeenCalledTimes(2));
  });

  it("shows the API error when a status update fails", async () => {
    vi.mocked(updateLeadStatus).mockRejectedValue(new Error("Lead not found"));
    render(<Home />);
    await screen.findByText("John Doe");

    await userEvent.selectOptions(screen.getByLabelText("Status for John Doe"), "LOST");

    expect((await screen.findByRole("alert")).textContent).toBe("Lead not found");
    // The row keeps the saved status because the update did not go through
    expect(screen.getByLabelText<HTMLSelectElement>("Status for John Doe").value).toBe("NEW");
  });
});
