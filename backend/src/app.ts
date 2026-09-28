import express, { Request, Response } from "express";
import cors from "cors";
import { Pool } from "pg";

// Type for Lead
export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
}

// The pool is passed in so tests can supply an in-memory database
export function createApp(pool: Pick<Pool, "query">) {
  const app = express();

  // Middleware
  app.use(cors({
    origin: "*",
    credentials: true,
  }));
  app.use(express.json());

  // ====== ENDPOINT 1: Create Lead ======
  app.post("/api/leads", async (req: Request, res: Response) => {
    try {
      const { name, email, phone } = req.body;

      if (!name || !email) {
        res.status(400).json({ error: "Name and email are required" });
        return;
      }

      const result = await pool.query(
        "INSERT INTO leads (name, email, phone, status) VALUES ($1, $2, $3, 'NEW') RETURNING *",
        [name, email, phone || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      if (error.code === "23505") {
        res.status(409).json({ error: "Email already exists" });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  // ====== ENDPOINT 2: List Leads + Search ======
  app.get("/api/leads", async (req: Request, res: Response) => {
    try {
      const { search, status } = req.query;
      let query = "SELECT * FROM leads WHERE 1=1";
      const params: any[] = [];

      // Search by name or email
      if (search) {
        query += ` AND (name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`;
        params.push(`%${search}%`);
      }

      // Filter by status
      if (status) {
        query += ` AND status = $${params.length + 1}`;
        params.push(status);
      }

      query += " ORDER BY created_at DESC";

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ====== ENDPOINT 3: Get Single Lead ======
  app.get("/api/leads/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await pool.query("SELECT * FROM leads WHERE id = $1", [id]);

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Lead not found" });
        return;
      }

      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ====== ENDPOINT 4: Update Lead Status ======
  app.patch("/api/leads/:id/status", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"];
      if (!validStatuses.includes(status)) {
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
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Health check
  app.get("/health", (req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  return app;
}
