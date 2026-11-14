import type { Metadata } from "next";
import { ru } from "@/i18n/ru";
import { BrainyLab } from "./BrainyLab";

export const metadata: Metadata = { title: ru.lab.brainy.title };

export default function BrainyLabPage() {
  return <BrainyLab />;
}
