import { z } from 'zod';
import type { Database } from '@eurostore/database';

export const collectionSchema = z.object({
  name_ar: z.string().trim().min(1).max(200),
  name_en: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description_ar: z.string().trim().max(5000).optional().nullable(),
  description_en: z.string().trim().max(5000).optional().nullable(),
  is_featured_on_homepage: z.boolean().default(false),
  has_standalone_page: z.boolean().default(true),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).max(100_000).default(0),
  product_ids: z.array(z.string().uuid()).max(500).default([]),
});

export function collectionRpcArgs(input: z.infer<typeof collectionSchema>, id: string | null) {
  type Args = Database['public']['Functions']['admin_save_collection']['Args'];
  // Supabase's generator does not represent nullable SQL function arguments.
  return {
    p_collection_id: id,
    p_name_ar: input.name_ar,
    p_name_en: input.name_en,
    p_slug: input.slug,
    p_description_ar: input.description_ar || null,
    p_description_en: input.description_en || null,
    p_is_featured_on_homepage: input.is_featured_on_homepage,
    p_has_standalone_page: input.has_standalone_page,
    p_is_active: input.is_active,
    p_sort_order: input.sort_order,
    p_product_ids: input.product_ids,
  } as unknown as Args;
}
