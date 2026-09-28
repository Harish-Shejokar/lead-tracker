import express, { Request, Response } from "express";
import cors, { CorsOptions } from "cors";
import { Pool } from "pg";

export const LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"];

// Type for Lead
export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns an error message, or null when the input is valid
function validateNewLead(name: unknown, email: unknown, phone: unknown): string | null {
  if (typeof name !== "string" || typeof email !== "string" || !name.trim() || !email.trim()) {
    return "Name and email are required";
  }
  if (name.trim().length > 255) {
    return "Name must be at most 255 characters";
  }
  if (email.trim().length > 255 || !EMAIL_PATTERN.test(email.trim())) {
    return "Email is invalid";
  }
  if (phone != null && phone !== "") {
    if (typeof phone !== "string") return "Phone is invalid";
    if (phone.trim().length > 20) return "Phone must be at most 20 characters";
  }
  return null;
}

// Route ids must be positive integers, otherwise Postgres rejects the query
function isValidId(id: string) {
  return /^[1-9]\d{0,9}$/.test(id);
}

// Logs the cause so failures show up in the server logs
function sendServerError(res: Response, error: unknown) {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
}

// The pool is passed in so tests can supply an in-memory database
export function createApp(pool: Pick<Pool, "query">, corsOrigin: CorsOptions["origin"] = "*") {
  const app = express();

  // Middleware
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());

  // ====== ENDPOINT 1: Create Lead ======
  app.post("/api/leads", async (req: Request, res: Response) => {
    try {
      const { name, email, phone } = req.body ?? {};

      const validationError = validateNewLead(name, email, phone);
      if (validationError) {
        res.status(400).json({ error: validationError });
        return;
      }

      // Emails are stored lowercase so the UNIQUE constraint is case-insensitive
      const result = await pool.query(
        "INSERT INTO leads (name, email, phone, status) VALUES ($1, $2, $3, 'NEW') RETURNING *",
        [name.trim(), email.trim().toLowerCase(), phone?.trim() || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      if (error.code === "23505") {
        res.status(409).json({ error: "Email already exists" });
      } else {
        sendServerError(res, error);
      }
    }
  });

  // ====== ENDPOINT 2: List Leads + Search ======
  app.get("/api/leads", async (req: Request, res: Response) => {
    try {
      const { search, status } = req.query;
      let query = "SELECT * FROM leads WHERE 1=1";
      const params: string[] = [];

      if (status && !LEAD_STATUSES.includes(String(status))) {
        res.status(400).json({ error: "Invalid status" });
        return;
      }

      // Search by name or email
      if (search) {
        query += ` AND (name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`;
        params.push(`%${search}%`);
      }

      // Filter by status
      if (status) {
        query += ` AND status = $${params.length + 1}`;
        params.push(String(status));
      }

      query += " ORDER BY created_at DESC";

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      sendServerError(res, error);
    }
  });

  // ====== ENDPOINT 3: Get Single Lead ======
  app.get("/api/leads/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!isValidId(id)) {
        res.status(400).json({ error: "Invalid lead id" });
        return;
      }

      const result = await pool.query("SELECT * FROM leads WHERE id = $1", [id]);

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Lead not found" });
        return;
      }

      res.json(result.rows[0]);
    } catch (error) {
      sendServerError(res, error);
    }
  });

  // ====== ENDPOINT 4: Update Lead Status ======
  app.patch("/api/leads/:id/status", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body ?? {};

      if (!isValidId(id)) {
        res.status(400).json({ error: "Invalid lead id" });
        return;
      }

      if (!LEAD_STATUSES.includes(status)) {
        res.status(400).json({ error: "Invalid status" });
        return;
      }

      const result = await pool.query(
        "UPDATE leads SET status = $1 WHERE id = $2 RETURNING *",
        [status, id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Lead not found" });
        return;
      }

      res.json(result.rows[0]);
    } catch (error) {
      sendServerError(res, error);
    }
  });

  // Health check
  app.get("/health", (req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  return app;
}
