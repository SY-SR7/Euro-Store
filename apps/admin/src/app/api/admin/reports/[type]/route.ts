import { NextRequest } from 'next/server';
import { GET as getReport } from '@/app/api/reports/route';

export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const url = new URL(request.url);
  url.searchParams.set('type', (await params).type);
  return getReport(new NextRequest(url, request));
}
