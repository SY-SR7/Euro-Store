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

function inferEmail(request: NextRequest): string {
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

async function readResponse(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => '');
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } },
) {
  const logs = await readLogs();
  const id = decodeURIComponent(context.params.id);
  const index = logs.findIndex((log) => String(log.id || '') === id);

  if (index < 0) {
    return NextResponse.json({ ok: false, error: 'لم يتم العثور على السجل' }, { status: 404 });
  }

  const log = logs[index];
  const undo = log.undo;

  if (!isObject(undo) || undo.possible !== true) {
    return NextResponse.json(
      { ok: false, error: isObject(undo) && typeof undo.reason === 'string' ? undo.reason : 'لا يمكن التراجع عن هذه العملية تلقائياً' },
      { status: 400 },
    );
  }

  if (log.undone_at) {
    return NextResponse.json({ ok: false, error: 'تم التراجع عن هذه الحركة مسبقاً' }, { status: 409 });
  }

  const method = typeof undo.method === 'string' ? undo.method.toUpperCase() : '';
  const targetPath = typeof undo.path === 'string' ? undo.path : '';

  if (!method || !targetPath || !targetPath.startsWith('/api/')) {
    return NextResponse.json({ ok: false, error: 'بيانات التراجع غير صالحة' }, { status: 400 });
  }

  const targetUrl = new URL(targetPath, request.nextUrl.origin);
  const hasBody = method !== 'GET' && method !== 'HEAD' && undo.body !== null && undo.body !== undefined;

  const response = await fetch(targetUrl.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('cookie') || '',
      'x-admin-activity-undo': '1',
      'x-admin-email': inferEmail(request),
    },
    body: hasBody ? JSON.stringify(undo.body) : undefined,
  });

  const payload = await readResponse(response);
  const now = new Date().toISOString();

  logs[index] = {
    ...log,
    undone_at: response.ok ? now : undefined,
    undo_status: response.status,
    undo_response: payload,
  };

  logs.unshift({
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    admin_email: inferEmail(request),
    action: 'undo',
    action_ar: 'تراجع',
    entity_type: String(log.entity_type || 'unknown'),
    entity_label: String(log.entity_label || ''),
    entity_id: String(log.entity_id || ''),
    summary: `تراجع عن: ${String(log.summary || log.action_ar || log.action || 'حركة')}`,
    method,
    path: targetPath,
    status_code: response.status,
    ok: response.ok,
    old_values: log.new_values,
    new_values: payload,
    source: 'admin-ui',
    created_at: now,
    related_log_id: id,
  });

  await writeLogs(logs);

  return NextResponse.json({
    ok: response.ok,
    status: response.status,
    response: payload,
  }, { status: response.ok ? 200 : 500 });
}