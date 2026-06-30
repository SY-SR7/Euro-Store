import { redirect } from 'next/navigation';

export default function OrderDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/orders?open=${params.id}`);
}