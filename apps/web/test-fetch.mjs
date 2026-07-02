import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data: all, error: err1 } = await supabase.from('products').select('slug').limit(1);
  console.log('Sample slug:', all);
  if (!all?.length) return;
  
  const slug = all[0].slug;
  const { data, error } = await supabase
        .from('products')
        .select('id,name_ar,name_en,slug,description_ar,category_id,brand_id,image_url,is_featured')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
        
  console.log('Result for', slug, ':', data);
  console.log('Error:', error);
}

test();
