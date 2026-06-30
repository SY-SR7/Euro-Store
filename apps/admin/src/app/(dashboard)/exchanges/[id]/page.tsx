import { redirect } from 'next/navigation';

export default function ExchangeDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/exchanges?open=${params.id}`);
}