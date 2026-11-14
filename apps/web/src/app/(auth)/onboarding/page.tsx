import type { Metadata } from "next";
import { OnboardingQuiz } from "./OnboardingQuiz";

export const metadata: Metadata = { title: "Onboarding" };

export default function OnboardingPage() {
  return <OnboardingQuiz />;
}
