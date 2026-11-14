import { getSettings, SettingsError, updateSettings } from "@brainee/db";
import { type NextRequest, NextResponse } from "next/server";
import { demoApi, readDemoJson, requireDemoToken } from "@/lib/server/demo-api";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  return demoApi(request, async (db, now) =>
    NextResponse.json(await getSettings(db, requireDemoToken(request), now)),
  );
}
export async function POST(request: NextRequest) {
  return demoApi(request, async (db, now) => {
    try {
      return NextResponse.json(
        await updateSettings(db, requireDemoToken(request), await readDemoJson(request), now),
      );
    } catch (error) {
      if (error instanceof SettingsError)
        return NextResponse.json({ error: error.reason }, { status: 403 });
      throw error;
    }
  });
}
