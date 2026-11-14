import type { Metadata } from "next";
import { en } from "@/i18n/en";
import { BrainyLab } from "./BrainyLab";

export const metadata: Metadata = { title: en.lab.brainy.title };

export default function BrainyLabPage() {
  return <BrainyLab />;
}
