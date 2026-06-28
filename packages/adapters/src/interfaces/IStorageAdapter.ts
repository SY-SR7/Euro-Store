/**
 * @eurostore/adapters — IStorageAdapter
 *
 * Interface for object storage services (Supabase Storage, AWS S3, Cloudflare R2).
 * Business logic NEVER calls storage SDKs directly — always through this interface.
 *
 * Current implementation: SupabaseStorageAdapter
 * Future: CloudflareR2Adapter (v2 — for multi-region redundancy/cost optimization)
 *
 * SECURITY CRITICAL:
 * - Buckets like 'loyalty-qr-codes' and 'exchange-qr-codes' contain private data.
 * - Private buckets MUST use getSignedUrl() with strict expiry — never getPublicUrl().
 * - Uploads must be pre-validated for magic bytes, MIME types, and file size in the API layer.
 */

export type StorageBucket =
  | 'product-images'
  | 'product-videos'
  | 'exchange-images'
  | 'loyalty-qr-codes'
  | 'exchange-qr-codes';

export type BucketVisibility = 'public' | 'private';

export interface UploadParams {
  /** Target storage bucket */
  bucket: StorageBucket;
  /** File path within the bucket (e.g., "products/uuid.png"). Must not contain path traversal (../). */
  path: string;
  /** File content as Buffer or Uint8Array */
  content: Buffer | Uint8Array;
  /** Validated MIME type */
  contentType: string;
  /** Size in bytes — verified against provider limits */
  size: number;
}

export interface UploadResult {
  /** Fully qualified URL (public URL for public buckets, base path for private) */
  url: string;
  /** Path within the bucket */
  path: string;
  bucket: StorageBucket;
}

export interface SignedUrlParams {
  bucket: StorageBucket;
  path: string;
  /** Time-to-live in seconds (recommended: short TTL like 900s / 15m) */
  expiresInSeconds: number;
}

/**
 * Interface for object storage services.
 *
 * Implementations:
 * - `SupabaseStorageAdapter` — Supabase Storage API (primary)
 * - `CloudflareR2Adapter` — future
 *
 * Security requirements:
 * 1. delete() requires authorization verification in the caller.
 * 2. exists() should not leak file presence to unauthorized users.
 * 3. Paths must be sanitized and randomized to prevent overwriting or guessing.
 */
export interface IStorageAdapter {
  /**
   * Upload a file to a specified storage bucket.
   * Input is expected to be validated (magic bytes, size, allowlist) before calling.
   */
  upload(params: UploadParams): Promise<UploadResult>;

  /**
   * Delete a file from a specified storage bucket.
   */
  delete(bucket: StorageBucket, path: string): Promise<void>;

  /**
   * Retrieve the public URL for a file.
   * Should only be used for public buckets ('product-images', 'product-videos').
   */
  getPublicUrl(bucket: StorageBucket, path: string): string;

  /**
   * Generate a secure, time-bound signed URL for accessing private bucket files
   * (e.g., 'exchange-qr-codes', 'loyalty-qr-codes').
   */
  getSignedUrl(params: SignedUrlParams): Promise<string>;

  /**
   * Check whether a file exists in the specified bucket and path.
   */
  exists(bucket: StorageBucket, path: string): Promise<boolean>;
}

/** Thrown when a storage operation fails at the provider level */
export class StorageAdapterError extends Error {
  constructor(
    message: string,
    public readonly bucket: StorageBucket,
    public readonly path?: string,
    public readonly providerCode?: string,
  ) {
    super(message);
    this.name = 'StorageAdapterError';
  }
}
