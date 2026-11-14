import { FunPlayer } from "@/components/leisure/FunPlayer";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FunPlayer id={id} />;
}
