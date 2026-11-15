import "server-only";

import { demoTokenHash, findDemoAccess, openDatabase } from "@brainee/db";
import { cookies } from "next/headers";
import { DEMO_COOKIE } from "./demo-api";

/** True when this device holds a valid, unrevoked family session (same check as /api/device). */
export async function familySession() {
  if (process.env.DEMO_MODE !== "1") return null;
  const token = demoTokenHash((await cookies()).get(DEMO_COOKIE)?.value);
  if (!token) return null;
  let connection: Awaited<ReturnType<typeof openDatabase>> | undefined;
  try {
    connection = await openDatabase();
    const access = await findDemoAccess(connection.db, token, new Date());
    return access && !access.revoked ? access : null;
  } catch {
    return null;
  } finally {
    connection?.client.close();
  }
}

export async function hasFamilySession() {
  return !!(await familySession());
}
