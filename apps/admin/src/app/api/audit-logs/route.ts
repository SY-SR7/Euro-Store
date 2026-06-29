import { NextRequest, NextResponse } from 'next/server';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ActivityLog = Record<string, unknown>;

const STORE_PATH = path.join(process.cwd(), '.admin-activity-log.json');
const MAX_LOGS = 5000;

async function ensureStoreDir() {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
}

async function readLogs(): Promise<ActivityLog[]> {
  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'object' && item !== null) as ActivityLog[] : [];
  } catch {
    return [];
  }
}

async function writeLogs(logs: ActivityLog[]) {
  await ensureStoreDir();
  await writeFile(STORE_PATH, JSON.stringify(logs.slice(0, MAX_LOGS), null, 2), 'utf8');
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function decodeEmailFromJwt(token: string): string {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return '';

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as unknown;
    return findEmail(payload);
  } catch {
    return '';
  }
}

function findEmail(value: unknown): string {
  if (!isObject(value)) return '';

  for (const key of ['email', 'admin_email', 'user_email']) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.includes('@')) return candidate;
  }

  for (const child of Object.values(value)) {
    const email = findEmail(child);
    if (email) return email;
  }

  return '';
}

function inferEmail(request: NextRequest, body?: unknown): string {
  const bodyEmail = findEmail(body);
  if (bodyEmail) return bodyEmail;

  for (const header of ['x-admin-email', 'x-user-email', 'x-email']) {
    const value = request.headers.get(header);
    if (value && value.includes('@')) return value;
  }

  for (const cookie of request.cookies.getAll()) {
    if (/email/i.test(cookie.name) && cookie.value.includes('@')) return decodeURIComponent(cookie.value);

    const tokenEmail = decodeEmailFromJwt(cookie.value);
    if (tokenEmail) return tokenEmail;
  }

  return 'unknown-admin@local';
}

function contains(haystack: unknown, needle: string): boolean {
  if (!needle) return true;
  try {
    return JSON.stringify(haystack).toLowerCase().includes(needle.toLowerCase());
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const logs = await readLogs();
  const searchParams = request.nextUrl.searchParams;

  const limit = Math.min(Number(searchParams.get('limit') || '250') || 250, 1000);
  const page = Math.max(Number(searchParams.get('page') || '1') || 1, 1);
  const action = searchParams.get('action') || '';
  const entity = searchParams.get('entity') || searchParams.get('entity_type') || '';
  const email = searchParams.get('email') || '';
  const search = searchParams.get('search') || '';

  const filtered = logs.filter((log) => {
    if (action && String(log.action || '') !== action) return false;
    if (entity && String(log.entity_type || '') !== entity) return false;
    if (email && String(log.admin_email || '') !== email) return false;
    if (search && !contains(log, search)) return false;
    return true;
  });

  const start = (page - 1) * limit;
  const pageLogs = filtered.slice(start, start + limit);

  return NextResponse.json({
    logs: pageLogs,
    total: filtered.length,
    page,
    limit,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const logs = await readLogs();

  const now = new Date().toISOString();
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const log: ActivityLog = {
    id,
    admin_email: inferEmail(request, body),
    action: isObject(body) && typeof body.action === 'string' ? body.action : 'activity',
    action_ar: isObject(body) && typeof body.action_ar === 'string' ? body.action_ar : 'حركة',
    entity_type: isObject(body) && typeof body.entity_type === 'string' ? body.entity_type : 'unknown',
    entity_label: isObject(body) && typeof body.entity_label === 'string' ? body.entity_label : '',
    entity_id: isObject(body) && typeof body.entity_id === 'string' ? body.entity_id : '',
    summary: isObject(body) && typeof body.summary === 'string' ? body.summary : '',
    source: isObject(body) && typeof body.source === 'string' ? body.source : 'admin-ui',
    created_at: isObject(body) && typeof body.created_at === 'string' ? body.created_at : now,
    ip:
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '',
    ...isObject(body) ? body : {},
    id,
    admin_email: inferEmail(request, body),
    created_at: isObject(body) && typeof body.created_at === 'string' ? body.created_at : now,
  };

  logs.unshift(log);
  await writeLogs(logs);

  return NextResponse.json({ ok: true, log });
}