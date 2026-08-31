import { Pool } from "pg";
import { config } from "./40-config.js";

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 2_000,
  idleTimeoutMillis: 30_000,
  application_name: "node-distributed-systems",
});

pool.on("error", (err) => {
  console.error({ event: "postgres_idle_client_error", err });
});
