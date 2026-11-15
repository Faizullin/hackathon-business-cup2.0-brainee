import "server-only";

import { demoTokenHash, findDemoAccess, openDatabase } from "@brainee/db";
import { cookies } from "next/headers";
import { DEMO_COOKIE } from "./demo-api";

/** True when this device holds a valid, unrevoked family session (same check as /api/device). */
export async function hasFamilySession() {
  if (process.env.DEMO_MODE !== "1") return false;
  const token = demoTokenHash((await cookies()).get(DEMO_COOKIE)?.value);
  if (!token) return false;
  let connection: Awaited<ReturnType<typeof openDatabase>> | undefined;
  try {
    connection = await openDatabase();
    const access = await findDemoAccess(connection.db, token, new Date());
    return !!access && !access.revoked;
  } catch {
    return false;
  } finally {
    connection?.client.close();
  }
}
