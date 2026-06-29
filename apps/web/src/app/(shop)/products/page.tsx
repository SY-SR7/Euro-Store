/* apps/web/src/app/(shop)/products/page.tsx — redirect to canonical route */
import { redirect } from 'next/navigation';

export default function ShopProductsRedirect() {
  redirect('/products');
}