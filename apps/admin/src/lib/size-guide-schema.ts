import { z } from 'zod';

const sizeGuideContentSchema = z.object({
  headers: z.array(z.string().trim().min(1).max(100)).min(1).max(30)
    .refine((headers) => new Set(headers).size === headers.length, 'duplicate_headers'),
  rows: z.array(z.array(z.string().max(500)).min(1).max(30)).min(1).max(200),
}).strict().superRefine((content, ctx) => {
  content.rows.forEach((row, index) => {
    if (row.length !== content.headers.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['rows', index], message: 'row_length_mismatch' });
    }
  });
});

export const sizeGuideSchema = z.object({
  name: z.string().trim().min(1).max(200),
  content: sizeGuideContentSchema,
}).strict();
