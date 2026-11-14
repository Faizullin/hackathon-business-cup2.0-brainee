import type { Metadata } from "next";
import { ru } from "@/i18n/ru";
import { OnboardingQuiz } from "./OnboardingQuiz";

export const metadata: Metadata = { title: ru.onboarding.title };

export default function OnboardingPage() {
  return <OnboardingQuiz />;
}
