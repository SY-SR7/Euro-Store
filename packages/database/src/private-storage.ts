const SAFE_STORAGE_PATH = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,1023}$/;

type PrivateStorageClient = {
  storage: {
    from(bucket: string): {
      createSignedUrls(paths: string[], expiresIn: number): PromiseLike<{
        data: Array<{ path?: string | null; signedUrl?: string | null }> | null;
        error: unknown;
      }>;
    };
  };
};

export function getPrivateStoragePath(value: string, bucket: string): string | null {
  const prefix = `${bucket}/`;
  let path = value.trim();

  if (path.startsWith(prefix)) {
    path = path.slice(prefix.length);
  } else {
    try {
      const parsed = new URL(path);
      const markers = [
        `/storage/v1/object/public/${bucket}/`,
        `/storage/v1/object/sign/${bucket}/`,
        `/storage/v1/object/${bucket}/`,
      ];
      const marker = markers.find((candidate) => parsed.pathname.includes(candidate));
      if (!marker) return null;
      path = decodeURIComponent(parsed.pathname.split(marker)[1] ?? '');
    } catch {
      return null;
    }
  }

  if (!SAFE_STORAGE_PATH.test(path) || path.includes('..') || path.includes('//')) return null;
  return path;
}

export async function createPrivateStorageUrlMap(
  client: PrivateStorageClient,
  bucket: string,
  storedValues: Array<string | null | undefined>,
  expiresInSeconds = 300,
): Promise<Map<string, string>> {
  const pathsByValue = new Map<string, string>();
  for (const value of storedValues) {
    if (!value) continue;
    const path = getPrivateStoragePath(value, bucket);
    if (path) pathsByValue.set(value, path);
  }

  const uniquePaths = [...new Set(pathsByValue.values())];
  if (uniquePaths.length === 0) return new Map();

  const { data, error } = await client.storage.from(bucket).createSignedUrls(uniquePaths, expiresInSeconds);
  if (error) throw error;

  const urlsByPath = new Map<string, string>();
  for (const entry of data ?? []) {
    if (entry.path && entry.signedUrl) urlsByPath.set(entry.path, entry.signedUrl);
  }

  return new Map(
    [...pathsByValue.entries()]
      .map(([value, path]) => [value, urlsByPath.get(path)] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[1])),
  );
}
