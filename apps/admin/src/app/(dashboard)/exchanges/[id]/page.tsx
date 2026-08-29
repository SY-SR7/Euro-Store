import { redirect } from 'next/navigation';

export default async function ExchangeDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/exchanges?open=${id}`);
}
