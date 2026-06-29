/* redirect to canonical /products route */
import { redirect } from 'next/navigation';
export default function ShopProductsRedirect() { redirect('/products'); }

