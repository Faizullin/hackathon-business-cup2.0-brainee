import { redirect } from "next/navigation";

// Explore games are sold for ★ in Leisure's "Games for stars" (played at /fun/<id>).
export default function ExplorePage() {
  redirect("/leisure");
}
