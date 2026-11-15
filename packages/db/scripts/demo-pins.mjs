// Hackathon demo: set every parent PIN to 1234 (DEMO_PIN) in the configured database.
// Usage: DATABASE_URL=... [DATABASE_AUTH_TOKEN=...] node scripts/demo-pins.mjs
import { randomBytes, scryptSync } from "node:crypto";
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL ?? "file:../../data/dev.db";
const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
const salt = randomBytes(16).toString("hex");
const hash = `scrypt$${salt}$${scryptSync("1234", salt, 64).toString("hex")}`;
const result = await client.execute({ sql: "update parents set pin_hash = ?", args: [hash] });
console.log(
  `${url.startsWith("file:") ? "local" : "remote"}: ${result.rowsAffected} parents set to PIN 1234`,
);
client.close();
