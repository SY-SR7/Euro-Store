import { z } from 'zod';

export const homepageSectionKeySchema = z.enum([
  'main_banner',
  'new_arrivals',
  'sales',
  'featured_brands',
  'most_popular',
]);

export const homepageBannerSchema = z.object({
  id: z.string().uuid(),
  title_ar: z.string().trim().max(300).default(''),
  title_en: z.string().trim().max(300).default(''),
  subtitle_ar: z.string().trim().max(1000).default(''),
  subtitle_en: z.string().trim().max(1000).default(''),
  image_url: z.string().url().optional(),
  mobile_image_url: z.string().url().optional(),
  video_url: z.string().url().optional(),
  cta_url: z.string().trim().regex(/^\/(?!\/)/).default('/products'),
  cta_label_ar: z.string().trim().max(100).default('تسوق الآن'),
  cta_label_en: z.string().trim().max(100).default('Shop now'),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().nonnegative(),
  created_at: z.string().datetime(),
}).strict().superRefine((value, ctx) => {
  if (Boolean(value.image_url) === Boolean(value.video_url)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['image_url'], message: 'exactly_one_media_required' });
  }
});

const limitContentSchema = z.object({ limit: z.number().int().min(1).max(24).default(12) }).strict();
const featuredBrandsContentSchema = z.object({
  brand_ids: z.array(z.string().uuid()).max(30).refine((ids) => new Set(ids).size === ids.length, 'duplicate_brand_id'),
}).strict();
const bannersContentSchema = z.object({ banners: z.array(homepageBannerSchema).max(20) }).strict();

export function parseHomepageContent(sectionKey: z.infer<typeof homepageSectionKeySchema>, content: unknown) {
  if (sectionKey === 'main_banner') return bannersContentSchema.safeParse(content);
  if (sectionKey === 'featured_brands') return featuredBrandsContentSchema.safeParse(content);
  return limitContentSchema.safeParse(content);
}

export function isTrustedHomepageMediaUrl(rawUrl: string) {
  try {
    const mediaUrl = new URL(rawUrl);
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '');
    return mediaUrl.protocol === 'https:' && mediaUrl.origin === supabaseUrl.origin && mediaUrl.pathname.includes('/storage/v1/object/public/');
  } catch {
    return false;
  }
}
