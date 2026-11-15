import { redirect } from "next/navigation";
import { hasFamilySession } from "@/lib/server/device-session";

export const dynamic = "force-dynamic";

/** First-run gate: a device with a family opens the app, any other device opens the funnel. */
export default async function HomePage() {
  redirect((await hasFamilySession()) ? "/entry" : "/start");
}
