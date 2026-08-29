const path = require('path');
const { createClient } = require(path.join(__dirname, '../apps/web/node_modules/@supabase/supabase-js'));
require(path.join(__dirname, '../apps/web/node_modules/dotenv')).config({ path: path.join(__dirname, '../apps/web/.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const discountUpdates = [
  { slug: 'dior-sauvage-eau-de-parfum-100ml', discount: 15 },
  { slug: 'versace-eros-eau-de-parfum-100ml', discount: 15 },
  { slug: 'chanel-coco-mademoiselle-edp-100ml', discount: 10 },
  { slug: 'dior-jadore-eau-de-parfum-100ml', discount: 10 },
  { slug: 'versace-bright-crystal-edt-90ml', discount: 20 },
  { slug: 'nike-air-force-1-women-white', discount: 10 },
  { slug: 'adidas-stan-smith-women-white-pink', discount: 15 },
  { slug: 'puma-carina-leather-sneaker-women', discount: 15 },
  { slug: 'lacoste-women-classic-pique-polo', discount: 10 },
  { slug: 'tommy-hilfiger-women-heritage-crewneck', discount: 15 },
  { slug: 'ray-ban-erika-classic-sunglasses', discount: 10 },
  { slug: 'adidas-superstar-white-black', discount: 20 },
  { slug: 'nike-air-max-90-essential', discount: 15 },
  { slug: 'skechers-uno-stand-on-air-black', discount: 15 },
  { slug: 'puma-smash-v2-leather-white', discount: 25 },
  { slug: 'boss-paddy-polo-shirt-black', discount: 15 },
  { slug: 'tommy-hilfiger-core-stretch-polo', discount: 10 },
  { slug: 'michael-kors-jet-set-travel-tote-black', discount: 20 }
];

async function applyDiscounts() {
  console.log('Applying authentic discounts to flagship products...\n');

  for (const item of discountUpdates) {
    const { data: p } = await supabase.from('products').select('id, name_ar, base_price').eq('slug', item.slug).single();
    if (p) {
      await supabase.from('products').update({ discount_percentage: item.discount }).eq('id', p.id);
      const originalPrice = Math.round(p.base_price / (1 - item.discount / 100));
      console.log(`✓ [${p.name_ar}] -> Discount: -${item.discount}% | Now: ${p.base_price.toLocaleString()} SYP | Was: ${originalPrice.toLocaleString()} SYP`);
    }
  }

  console.log('\nAll discounts configured successfully!');
}

applyDiscounts();
