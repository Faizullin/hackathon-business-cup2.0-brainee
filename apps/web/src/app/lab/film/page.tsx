import type { Metadata } from "next";
import { en } from "@/i18n/en";
import { FilmLab } from "./FilmLab";

export const metadata: Metadata = { title: en.lab.film.title };

export default function FilmLabPage() {
  return <FilmLab />;
}
