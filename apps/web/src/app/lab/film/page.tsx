import type { Metadata } from "next";
import { ru } from "@/i18n/ru";
import { FilmLab } from "./FilmLab";

export const metadata: Metadata = { title: ru.lab.film.title };

export default function FilmLabPage() {
  return <FilmLab />;
}
