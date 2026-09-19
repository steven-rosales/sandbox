import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { z } from "zod";

if (existsSync(".env")) {
  loadEnvFile(".env");
}

const ConfigSchema = z.object({
  DATABASE_URL: z.string().min(1),

  PROVIDER_URL: z.url().default("http://127.0.0.1:9090"),

  API_PORT: z.coerce.number().int().min(1).max(65535).default(8080),

  PROVIDER_PORT: z.coerce.number().int().min(1).max(65_535).default(9090),
});

export const config = ConfigSchema.parse(process.env);
