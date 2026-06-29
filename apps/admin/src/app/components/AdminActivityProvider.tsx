'use client';

import { ReactNode, useEffect, useRef } from 'react';

type PlainObject = Record<string, unknown>;

const EXCLUDED_PATHS = [
  '/api/audit-logs',
  '/api/admin-activity',
  '/api/auth',
  '/api/session',
  '/api/me',
];

function isObject(value: unknown): value is PlainObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function findEmailDeep(value: unknown): string {
  if (!isObject(value)) return '';

  for (const key of ['email', 'admin_email', 'user_email']) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.includes('@')) return candidate;
  }

  for (const child of Object.values(value)) {
    if (isObject(child)) {
      const email = findEmailDeep(child);
      if (email) return email;
    }
  }

  return '';
}

function getCookieEmail(): string {
  if (typeof document === 'undefined') return '';

  const raw = document.cookie || '';
  const parts = raw.split(';').map((part) => part.trim());

  for (const part of parts) {
    const [key, ...rest] = part.split('=');
    const value = decodeURIComponent(rest.join('=') || '');

    if (/email/i.test(key) && value.includes('@')) return value;

    const tokenParts = value.split('.');
    if (tokenParts.length >= 2) {
      try {
        const normalized = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(atob(normalized)) as unknown;
        const email = findEmailDeep(decoded);
        if (email) return email;
      } catch {
        // ignore invalid cookie tokens
      }
    }
  }

  return '';
}

function getStoredEmail(): string {
  if (typeof window === 'undefined') return '';

  const keys = [
    'admin_email',
    'adminEmail',
    'user_email',
    'userEmail',
    'email',
    'eurostore_admin_email',
    'eurostore-admin-email',
    'supabase.auth.token',
  ];

  for (const key of keys) {
    const value = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
    if (!value) continue;

    if (value.includes('@') && !value.trim().startsWith('{')) return value;

    try {
      const parsed = JSON.parse(value) as unknown;
      const email = findEmailDeep(parsed);
      if (email) return email;
    } catch {
      // ignore invalid storage data
    }
  }

  return '';
}

function normalizePath(input: RequestInfo | URL): string {
  const raw =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

  try {
    const url = new URL(raw, window.location.origin);
    return url.pathname + url.search;
  } catch {
    return String(raw);
  }
}

function pathOnly(pathWithQuery: string): string {
  return pathWithQuery.split('?')[0] || pathWithQuery;
}

function shouldSkip(pathWithQuery: string, method: string): boolean {
  const pathname = pathOnly(pathWithQuery);

  if (!pathname.startsWith('/api/')) return true;
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true;

  return EXCLUDED_PATHS.some((path) => pathname.startsWith(path));
}

function readRequestBody(input: RequestInfo | URL, init?: RequestInit): unknown {
  const directBody = init?.body;

  if (directBody instanceof FormData) {
    const obj: PlainObject = {};
    directBody.forEach((value, key) => {
      obj[key] = typeof value === 'string' ? value : `[file:${value.name}]`;
    });
    return obj;
  }

  if (directBody instanceof URLSearchParams) {
    return Object.fromEntries(directBody.entries());
  }

  if (typeof directBody === 'string') return parseMaybeJson(directBody);

  if (directBody && typeof directBody === 'object') {
    return '[non-json-body]';
  }

  if (input instanceof Request) {
    try {
      const cloned = input.clone();
      return cloned.text().then(parseMaybeJson).catch(() => undefined);
    } catch {
      return undefined;
    }
  }

  return undefined;
}

async function readResponsePayload(response: Response): Promise<unknown> {
  try {
    const text = await response.clone().text();
    return parseMaybeJson(text);
  } catch {
    return undefined;
  }
}

async function getSnapshot(originalFetch: typeof fetch, pathWithQuery: string): Promise<unknown> {
  try {
    const response = await originalFetch(pathWithQuery, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'include',
      headers: {
        'x-admin-activity-snapshot': '1',
      },
    });

    if (!response.ok) return undefined;

    return await readResponsePayload(response);
  } catch {
    return undefined;
  }
}

function extractSingleRecord(payload: unknown): unknown {
  if (!isObject(payload)) return payload;

  for (const key of ['data', 'item', 'order', 'customer', 'category', 'brand', 'discount', 'rate', 'exchange', 'product', 'setting']) {
    const value = payload[key];
    if (isObject(value)) return value;
  }

  return payload;
}

function extractCreatedId(payload: unknown): string {
  const record = extractSingleRecord(payload);

  if (isObject(record)) {
    for (const key of ['id', 'uuid', 'order_id', 'customer_id', 'category_id', 'brand_id', 'discount_id']) {
      const value = record[key];
      if (typeof value === 'string' || typeof value === 'number') return String(value);
    }
  }

  return '';
}

function lastPathId(pathWithQuery: string): string {
  const pathname = pathOnly(pathWithQuery);
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1] || '';

  if (last && last !== 'api') return decodeURIComponent(last);
  return '';
}

function collectionPath(pathWithQuery: string): string {
  const pathname = pathOnly(pathWithQuery);
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length <= 2) return pathname;

  return '/' + parts.slice(0, -1).join('/');
}

function entityTypeFromPath(pathWithQuery: string): string {
  const pathname = pathOnly(pathWithQuery);
  const parts = pathname.split('/').filter(Boolean);

  if (parts[0] === 'api') {
    if (parts[1] === 'catalog' && parts[2]) return `catalog/${parts[2]}`;
    return parts[1] || 'unknown';
  }

  return 'unknown';
}

function entityNameAr(entityType: string): string {
  const map: Record<string, string> = {
    orders: 'الطلبات',
    exchanges: 'التبديلات',
    customers: 'العملاء',
    discounts: 'الخصومات',
    'catalog/categories': 'التصنيفات',
    'catalog/brands': 'الماركات',
    products: 'المنتجات',
    homepage: 'الواجهة الرئيسية',
    settings: 'الإعدادات',
    'shipping-rates': 'أسعار الشحن',
    'loyalty-settings': 'الولاء',
    'sub-admins': 'المشرفون',
    'exchange-rates': 'أسعار الصرف',
  };

  return map[entityType] || entityType;
}

function actionFrom(method: string, body: unknown, pathWithQuery: string): { action: string; action_ar: string } {
  const payload = isObject(body) ? body : {};

  if (method === 'DELETE') return { action: 'delete', action_ar: 'حذف' };

  if (typeof payload.status === 'string') {
    const status = payload.status;
    const map: Record<string, string> = {
      confirmed: 'تأكيد',
      pending: 'إرجاع للانتظار',
      processing: 'نقل للتجهيز',
      shipped: 'تأكيد الشحن',
      delivered: 'تأكيد التسليم',
      cancelled: 'إلغاء',
      approved: 'قبول',
      rejected: 'رفض',
      completed: 'إكمال',
      active: 'تفعيل',
      inactive: 'تعطيل',
      hidden: 'إخفاء',
      visible: 'إظهار',
    };

    return { action: `status:${status}`, action_ar: map[status] || `تغيير الحالة إلى ${status}` };
  }

  for (const key of ['is_active', 'active', 'enabled']) {
    if (typeof payload[key] === 'boolean') {
      return payload[key]
        ? { action: 'activate', action_ar: 'تفعيل' }
        : { action: 'deactivate', action_ar: 'تعطيل' };
    }
  }

  for (const key of ['is_visible', 'visible', 'is_published', 'published', 'show', 'display']) {
    if (typeof payload[key] === 'boolean') {
      return payload[key]
        ? { action: 'show', action_ar: 'إظهار' }
        : { action: 'hide', action_ar: 'إخفاء' };
    }
  }

  if (method === 'POST') return { action: 'create', action_ar: 'إنشاء' };
  if (method === 'PUT') return { action: 'replace', action_ar: 'استبدال كامل' };
  if (method === 'PATCH') return { action: 'update', action_ar: 'تعديل' };

  return { action: method.toLowerCase(), action_ar: method };
}

function buildUndo(method: string, pathWithQuery: string, beforePayload: unknown, afterPayload: unknown): unknown {
  const pathname = pathOnly(pathWithQuery);
  const before = extractSingleRecord(beforePayload);
  const after = extractSingleRecord(afterPayload);

  if ((method === 'PATCH' || method === 'PUT') && isObject(before)) {
    return {
      possible: true,
      method: 'PATCH',
      path: pathname,
      body: before,
      reason: 'إرجاع القيم القديمة قبل التعديل',
    };
  }

  if (method === 'DELETE' && isObject(before)) {
    return {
      possible: true,
      method: 'POST',
      path: collectionPath(pathname),
      body: before,
      reason: 'إعادة إنشاء العنصر المحذوف من النسخة القديمة',
    };
  }

  if (method === 'POST') {
    const createdId = extractCreatedId(after);
    if (createdId) {
      return {
        possible: true,
        method: 'DELETE',
        path: `${pathname.replace(/\/$/, '')}/${encodeURIComponent(createdId)}`,
        body: null,
        reason: 'حذف العنصر الذي تم إنشاؤه',
      };
    }
  }

  return {
    possible: false,
    reason: 'لا يوجد تراجع تلقائي آمن لهذه العملية',
  };
}

function summaryFrom(actionAr: string, entityType: string, entityId: string, status: number): string {
  const entity = entityNameAr(entityType);
  const suffix = entityId ? ` — المعرّف: ${entityId}` : '';
  return `${actionAr} في ${entity}${suffix} — نتيجة العملية: ${status}`;
}

async function getAdminEmail(originalFetch: typeof fetch, cachedRef: { current: string }): Promise<string> {
  if (cachedRef.current) return cachedRef.current;

  const fromStorage = getStoredEmail();
  if (fromStorage) {
    cachedRef.current = fromStorage;
    return fromStorage;
  }

  const fromCookie = getCookieEmail();
  if (fromCookie) {
    cachedRef.current = fromCookie;
    return fromCookie;
  }

  const endpoints = [
    '/api/admin-activity/current',
    '/api/auth/me',
    '/api/admin/me',
    '/api/me',
    '/api/session',
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await originalFetch(endpoint, { cache: 'no-store', credentials: 'include' });
      if (!response.ok) continue;

      const payload = await readResponsePayload(response);
      const email = findEmailDeep(payload);
      if (email) {
        cachedRef.current = email;
        return email;
      }
    } catch {
      // try next endpoint
    }
  }

  return 'unknown-admin@local';
}

export default function AdminActivityProvider({ children }: { children: ReactNode }) {
  const installedRef = useRef(false);
  const emailRef = useRef('');

  useEffect(() => {
    if (installedRef.current) return;
    installedRef.current = true;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const method = String(init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
      const pathWithQuery = normalizePath(input);

      if (shouldSkip(pathWithQuery, method)) {
        return originalFetch(input, init);
      }

      const bodyOrPromise = readRequestBody(input, init);
      const requestBody = bodyOrPromise instanceof Promise ? await bodyOrPromise : bodyOrPromise;

      const beforePayload =
        method === 'PATCH' || method === 'PUT' || method === 'DELETE'
          ? await getSnapshot(originalFetch, pathWithQuery)
          : undefined;

      const response = await originalFetch(input, init);
      const responsePayload = await readResponsePayload(response);

      try {
        const adminEmail = await getAdminEmail(originalFetch, emailRef);
        const entityType = entityTypeFromPath(pathWithQuery);
        const entityId = lastPathId(pathWithQuery);
        const action = actionFrom(method, requestBody, pathWithQuery);
        const undo = buildUndo(method, pathWithQuery, beforePayload, responsePayload);

        await originalFetch('/api/audit-logs', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-activity-client': '1',
            'x-admin-email': adminEmail,
          },
          body: JSON.stringify({
            admin_email: adminEmail,
            action: action.action,
            action_ar: action.action_ar,
            entity_type: entityType,
            entity_label: entityNameAr(entityType),
            entity_id: entityId,
            method,
            path: pathOnly(pathWithQuery),
            query: pathWithQuery.includes('?') ? pathWithQuery.split('?').slice(1).join('?') : '',
            summary: summaryFrom(action.action_ar, entityType, entityId, response.status),
            status_code: response.status,
            ok: response.ok,
            request_body: requestBody,
            old_values: beforePayload,
            new_values: responsePayload,
            undo,
            source: 'admin-ui',
            user_agent: navigator.userAgent,
            created_at: new Date().toISOString(),
          }),
        });
      } catch {
        // لا نكسر واجهة الآدمن إذا فشل تسجيل الحركة
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
      installedRef.current = false;
    };
  }, []);

  return <>{children}</>;
}