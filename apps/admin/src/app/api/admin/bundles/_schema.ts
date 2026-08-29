import { z } from 'zod';
import type { Database } from '@eurostore/database';

export const bundleSchema = z.object({
  name_ar: z.string().trim().min(1).max(200),
  name_en: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description_ar: z.string().trim().max(5000).optional().nullable(),
  description_en: z.string().trim().max(5000).optional().nullable(),
  bundle_price: z.number().int().min(0),
  status: z.enum(['draft', 'published', 'archived']),
  items: z.array(z.object({ product_variant_id: z.string().uuid(), quantity: z.number().int().min(1).max(100) })).min(1).max(100),
}).superRefine((input, ctx) => {
  const ids = input.items.map((item) => item.product_variant_id);
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['items'], message: 'duplicate_variant' });
});

export function bundleRpcArgs(input: z.infer<typeof bundleSchema>, id: string | null) {
  type Args = Database['public']['Functions']['admin_save_product_bundle']['Args'];
  // Supabase's generator does not represent nullable SQL function arguments.
  return {
    p_bundle_id: id,
    p_name_ar: input.name_ar,
    p_name_en: input.name_en,
    p_slug: input.slug,
    p_description_ar: input.description_ar || null,
    p_description_en: input.description_en || null,
    p_bundle_price: input.bundle_price,
    p_status: input.status,
    p_items: input.items,
  } as unknown as Args;
}
