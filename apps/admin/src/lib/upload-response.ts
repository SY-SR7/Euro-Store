import { z } from 'zod';

export const uploadResponseSchema = z.object({
  files: z.array(z.object({
    type: z.enum(['image', 'video']),
    url: z.string().url(),
    originalName: z.string().min(1),
  })),
});

export function responseError(value: unknown, fallback: string): string {
  if (!value || typeof value !== 'object') return fallback;
  const error = (value as { error?: unknown }).error;
  return typeof error === 'string' ? error : fallback;
}
