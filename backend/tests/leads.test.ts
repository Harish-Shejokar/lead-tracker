import fs from "fs";
import path from "path";
import request from "supertest";
import { newDb } from "pg-mem";
import { Pool } from "pg";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";

const schema = fs.readFileSync(path.join(__dirname, "../src/schema.sql"), "utf8");

// Fresh in-memory Postgres per test, built from the real schema.sql
function createTestPool(): Pool {
  const db = newDb();
  db.public.none(schema);
  const { Pool: MemPool } = db.adapters.createPg();
  return new MemPool();
}

// Simulates the database being unreachable
const brokenPool = {
  query: () => Promise.reject(new Error("connection refused")),
} as unknown as Pool;

let pool: Pool;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  pool = createTestPool();
  app = createApp(pool);
});

function seedLead(name: string, email: string, status: string, createdAt: string) {
  return pool.query(
    "INSERT INTO leads (name, email, phone, status, created_at) VALUES ($1, $2, NULL, $3, $4)",
    [name, email, status, createdAt]
  );
}

describe("GET /health", () => {
  it("returns ok", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("POST /api/leads", () => {
  it("creates a lead with status NEW and a created_at timestamp", async () => {
    const res = await request(app)
      .post("/api/leads")
      .send({ name: "John Doe", email: "john@example.com", phone: "9876543210" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      phone: "9876543210",
      status: "NEW",
    });
    expect(Date.parse(res.body.created_at)).not.toBeNaN();
  });

  it("stores phone as null when it is not provided", async () => {
    const res = await request(app)
      .post("/api/leads")
      .send({ name: "Jane Foster", email: "jane@example.com" });

    expect(res.status).toBe(201);
    expect(res.body.phone).toBeNull();
  });

  it("ignores a status sent by the client and always starts at NEW", async () => {
    const res = await request(app)
      .post("/api/leads")
      .send({ name: "Jane Foster", email: "jane@example.com", status: "CONVERTED" });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("NEW");
  });

  it.each([
    ["name", { email: "john@example.com" }],
    ["email", { name: "John Doe" }],
  ])("returns 400 when %s is missing", async (_field, body) => {
    const res = await request(app).post("/api/leads").send(body);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Name and email are required" });

    const list = await request(app).get("/api/leads");
    expect(list.body).toHaveLength(0);
  });

  it("returns 409 when the email already exists", async () => {
    await request(app).post("/api/leads").send({ name: "John Doe", email: "john@example.com" });

    const res = await request(app)
      .post("/api/leads")
      .send({ name: "Another John", email: "john@example.com" });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: "Email already exists" });
  });

  it("returns 500 when the database fails", async () => {
    const res = await request(createApp(brokenPool))
      .post("/api/leads")
      .send({ name: "John Doe", email: "john@example.com" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});

describe("GET /api/leads", () => {
  beforeEach(async () => {
    await seedLead("John Doe", "john@example.com", "NEW", "2026-09-20T10:00:00Z");
    await seedLead("Jane Foster", "jane@acme.io", "CONTACTED", "2026-09-22T10:00:00Z");
    await seedLead("Harry Potter", "harry@example.com", "CONTACTED", "2026-09-21T10:00:00Z");
  });

  it("lists all leads, newest first", async () => {
    const res = await request(app).get("/api/leads");

    expect(res.status).toBe(200);
    expect(res.body.map((l: { name: string }) => l.name)).toEqual([
      "Jane Foster",
      "Harry Potter",
      "John Doe",
    ]);
  });

  it("returns an empty list when there are no leads", async () => {
    const res = await request(createApp(createTestPool())).get("/api/leads");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("searches by partial name, case-insensitively", async () => {
    const res = await request(app).get("/api/leads").query({ search: "JOHN" });

    expect(res.body.map((l: { name: string }) => l.name)).toEqual(["John Doe"]);
  });

  it("searches by email", async () => {
    const res = await request(app).get("/api/leads").query({ search: "acme.io" });

    expect(res.body.map((l: { name: string }) => l.name)).toEqual(["Jane Foster"]);
  });

  it("filters by status", async () => {
    const res = await request(app).get("/api/leads").query({ status: "CONTACTED" });

    expect(res.body.map((l: { name: string }) => l.name)).toEqual(["Jane Foster", "Harry Potter"]);
  });

  it("combines search and status filter", async () => {
    const res = await request(app)
      .get("/api/leads")
      .query({ search: "example.com", status: "CONTACTED" });

    expect(res.body.map((l: { name: string }) => l.name)).toEqual(["Harry Potter"]);
  });

  it("returns an empty list when nothing matches", async () => {
    const res = await request(app).get("/api/leads").query({ search: "nobody" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns 500 when the database fails", async () => {
    const res = await request(createApp(brokenPool)).get("/api/leads");

    expect(res.status).toBe(500);
  });
});

describe("GET /api/leads/:id", () => {
  it("returns the lead", async () => {
    await request(app).post("/api/leads").send({ name: "John Doe", email: "john@example.com" });

    const res = await request(app).get("/api/leads/1");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, name: "John Doe" });
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).get("/api/leads/999");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Lead not found" });
  });
});

describe("PATCH /api/leads/:id/status", () => {
  beforeEach(async () => {
    await request(app).post("/api/leads").send({ name: "John Doe", email: "john@example.com" });
  });

  it.each(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"])(
    "updates the status to %s and persists it",
    async (status) => {
      const res = await request(app).patch("/api/leads/1/status").send({ status });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(status);

      const saved = await request(app).get("/api/leads/1");
      expect(saved.body.status).toBe(status);
    }
  );

  it("returns 400 for an invalid status and leaves the lead unchanged", async () => {
    const res = await request(app).patch("/api/leads/1/status").send({ status: "WON" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid status" });

    const saved = await request(app).get("/api/leads/1");
    expect(saved.body.status).toBe("NEW");
  });

  it("returns 400 when status is missing", async () => {
    const res = await request(app).patch("/api/leads/1/status").send({});

    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).patch("/api/leads/999/status").send({ status: "LOST" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Lead not found" });
  });
});
