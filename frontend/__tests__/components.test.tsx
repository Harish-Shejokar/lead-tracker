import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateLeadForm from "@/components/CreateLeadForm";
import LeadTable from "@/components/LeadTable";
import { Lead } from "@/lib/api";

describe("CreateLeadForm", () => {
  async function fillForm(name: string, email: string, phone = "") {
    const user = userEvent.setup();
    if (name) await user.type(screen.getByPlaceholderText("John Doe"), name);
    if (email) await user.type(screen.getByPlaceholderText("john@example.com"), email);
    if (phone) await user.type(screen.getByPlaceholderText("+1 (555) 000-0000"), phone);
    await user.click(screen.getByRole("button", { name: "Create Lead" }));
  }

  it("submits the entered values and clears the form", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<CreateLeadForm onSubmit={onSubmit} />);

    await fillForm("John Doe", "john@example.com", "9876543210");

    expect(onSubmit).toHaveBeenCalledWith({
      name: "John Doe",
      email: "john@example.com",
      phone: "9876543210",
    });
    expect(screen.getByPlaceholderText<HTMLInputElement>("John Doe").value).toBe("");
    expect(screen.getByPlaceholderText<HTMLInputElement>("john@example.com").value).toBe("");
  });

  it("allows phone to be left empty", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<CreateLeadForm onSubmit={onSubmit} />);

    await fillForm("John Doe", "john@example.com");

    expect(onSubmit).toHaveBeenCalledWith({ name: "John Doe", email: "john@example.com", phone: "" });
  });

  it.each([
    ["name", "", "john@example.com"],
    ["email", "John Doe", ""],
  ])("does not submit when %s is empty", async (_field, name, email) => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const onSubmit = vi.fn();
    render(<CreateLeadForm onSubmit={onSubmit} />);

    await fillForm(name, email);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith("Name and email are required");
  });

  it("keeps the entered values when submitting fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onSubmit = vi.fn().mockRejectedValue(new Error("Email already exists"));
    render(<CreateLeadForm onSubmit={onSubmit} />);

    await fillForm("John Doe", "john@example.com");

    expect(screen.getByPlaceholderText<HTMLInputElement>("John Doe").value).toBe("John Doe");
    expect(screen.getByRole("button", { name: "Create Lead" })).toHaveProperty("disabled", false);
  });
});

describe("LeadTable", () => {
  const leads: Lead[] = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      phone: "9876543210",
      status: "NEW",
      created_at: "2026-09-25T12:00:00Z",
    },
    {
      id: 2,
      name: "Jane Foster",
      email: "jane@example.com",
      phone: null,
      status: "CONTACTED",
      created_at: "2026-09-20T12:00:00Z",
    },
  ];

  it("renders one row per lead with all fields", () => {
    render(<LeadTable leads={leads} onStatusUpdate={vi.fn()} />);

    const rows = screen.getAllByRole("row").slice(1); // skip header
    expect(rows).toHaveLength(2);

    const first = within(rows[0]);
    first.getByText("John Doe");
    first.getByText("john@example.com");
    first.getByText("9876543210");
    first.getByText("Sep 25, 2026");
    expect(first.getByRole<HTMLSelectElement>("combobox").value).toBe("NEW");
  });

  it("shows a dash when phone is missing", () => {
    render(<LeadTable leads={leads} onStatusUpdate={vi.fn()} />);

    const secondRow = screen.getAllByRole("row")[2];
    within(secondRow).getByText("—");
  });

  it("calls onStatusUpdate with the lead id and new status", async () => {
    const onStatusUpdate = vi.fn();
    render(<LeadTable leads={leads} onStatusUpdate={onStatusUpdate} />);

    const secondRow = screen.getAllByRole("row")[2];
    await userEvent.selectOptions(within(secondRow).getByRole("combobox"), "QUALIFIED");

    expect(onStatusUpdate).toHaveBeenCalledWith(2, "QUALIFIED");
  });
});
