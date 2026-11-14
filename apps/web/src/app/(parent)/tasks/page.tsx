import type { Metadata } from "next";
import { TasksScreen } from "@/components/parent/TasksScreen";

export const metadata: Metadata = { title: "Tasks" };

export default function Page() {
  return <TasksScreen />;
}
