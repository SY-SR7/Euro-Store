import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';

const configuredBaseUrl = process.env.EXPO_PUBLIC_APP_URL || '';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code);
    this.name = 'ApiError';
  }
}

function apiBaseUrl(): string {
  if (!configuredBaseUrl) {
    throw new Error('Missing EXPO_PUBLIC_APP_URL.');
  }

  const url = new URL(configuredBaseUrl);
  if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    throw new Error('EXPO_PUBLIC_APP_URL must use HTTPS outside local development.');
  }
  return url.toString().replace(/\/$/, '');
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  headers.set('Origin', new URL(apiBaseUrl()).origin);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);

  const response = await fetch(`${apiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`, {
    ...init,
    headers,
  });
  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;

  if (!response.ok) {
    const nested = payload?.error && typeof payload.error === 'object'
      ? payload.error as Record<string, unknown>
      : null;
    const code = String(nested?.code ?? payload?.error ?? 'request_failed');
    throw new ApiError(response.status, code);
  }

  return payload as T;
}

export async function apiDownload(path: string, fileName: string): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new ApiError(401, 'unauthorized');
  const safeName = fileName.replace(/[^A-Za-z0-9._-]/g, '_');
  const destination = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory}${safeName}`;
  const result = await FileSystem.downloadAsync(
    `${apiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`,
    destination,
    { headers: { Authorization: `Bearer ${session.access_token}`, Origin: new URL(apiBaseUrl()).origin } },
  );
  if (result.status < 200 || result.status >= 300) {
    await FileSystem.deleteAsync(result.uri, { idempotent: true }).catch(() => undefined);
    throw new ApiError(result.status, 'download_failed');
  }
  return result.uri;
}
