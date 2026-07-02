import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, requireAdminContext } from '@/supabase-server';

export const dynamic = 'force-dynamic';

function getExt(filename: string, isVideo: boolean) {
  const parts = filename.split('.');
  if (parts.length > 1) return '.' + parts.pop();
  return isVideo ? '.mp4' : '.jpg';
}

export async function POST(request: Request) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
try {
    const formData = await request.formData();
    const files = formData.getAll('file') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const adminClient = createAdminSupabaseClient();
    const results = [];

    for (const file of files) {
      const isVideo = file.type.startsWith('video/');
      const bucket = isVideo ? 'product-videos' : 'product-images';
      
      const ext = getExt(file.name, isVideo);
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;

      const { data, error } = await adminClient.storage
        .from(bucket)
        .upload(filename, file, { contentType: file.type });

      if (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error?.message || 'database_error' }, { status: 500 });
      }

      const { data: publicUrlData } = adminClient.storage
        .from(bucket)
        .getPublicUrl(data.path);

      results.push({
        type: isVideo ? 'video' : 'image',
        url: publicUrlData.publicUrl,
        originalName: file.name
      });
    }

    return NextResponse.json({ files: results });
  } catch (err) {
    console.error('Upload handler error:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
