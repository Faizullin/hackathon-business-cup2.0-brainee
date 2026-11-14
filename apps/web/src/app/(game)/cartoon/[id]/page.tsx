import { CartoonPlayer } from "@/components/leisure/CartoonPlayer";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CartoonPlayer key={id} id={id} />;
}
