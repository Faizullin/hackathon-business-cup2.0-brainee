import { redirect } from "next/navigation";

// Opening the app is an entry into child mode: start with «Во что играем сейчас?» (T-31).
export default function HomePage() {
  redirect("/entry");
}
