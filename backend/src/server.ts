import { Pool } from "pg";
import dotenv from "dotenv";
import { createApp } from "./app";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Comma-separated list of allowed frontend origins; allows any origin when unset
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : "*";

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const app = createApp(pool, CORS_ORIGIN);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
