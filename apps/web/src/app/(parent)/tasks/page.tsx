import type { Metadata } from "next";
import { TasksScreen } from "@/components/parent/TasksScreen";
import { ru } from "@/i18n/ru";

export const metadata: Metadata = { title: ru.parent.tasks.title };

export default function Page() {
  return <TasksScreen />;
}
