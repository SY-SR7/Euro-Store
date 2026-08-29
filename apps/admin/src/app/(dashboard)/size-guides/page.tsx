import { Plus, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';
import ConfirmedSubmitButton from '../../components/ConfirmedSubmitButton';

export default async function SizeGuidesPage() {
  const isAr = await getLocale() === 'ar';
  const ctx = await requireAdminContext('product_management', 'view');
  if (!ctx) redirect('/login');
  const { data: guides } = await ctx.admin
    .from('size_guides')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isAr ? 'أدلة المقاسات' : 'Size Guides'}</h1>
        <Link
          href="/size-guides/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          {isAr ? 'إنشاء دليل مقاسات' : 'Create Size Guide'}
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">{isAr ? 'الاسم' : 'Name'}</th>
                <th className="p-4 font-medium">{isAr ? 'تاريخ الإنشاء' : 'Created At'}</th>
                <th className="p-4 text-right font-medium">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {guides?.map((guide) => (
                <tr key={guide.id} className="hover:bg-muted/50">
                  <td className="p-4 font-medium">{guide.name}</td>
                  <td className="p-4 text-muted-foreground">{guide.created_at ? new Date(guide.created_at).toLocaleDateString() : '-'}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/size-guides/${guide.id}`} aria-label={isAr ? `تعديل ${guide.name}` : `Edit ${guide.name}`} title={isAr ? 'تعديل' : 'Edit'} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Edit2 className="h-4 w-4" />
                      </Link>
                      <form action={async () => {
                        'use server';
                        const actionCtx = await requireAdminContext('product_management', 'delete');
                        if (!actionCtx) return;
                        const { data: before } = await actionCtx.admin.from('size_guides').select('*').eq('id', guide.id).maybeSingle();
                        await actionCtx.admin.from('size_guides').delete().eq('id', guide.id);
                        await writeAuditLog({ admin: actionCtx.admin, actorId: actionCtx.userId, actorRole: actionCtx.role, action: 'size_guide.deleted', entityType: 'size_guides', entityId: guide.id, beforeState: before });
                        const { revalidatePath } = await import('next/cache');
                        revalidatePath('/size-guides');
                      }}>
                        <ConfirmedSubmitButton
                          ariaLabel={isAr ? `حذف ${guide.name}` : `Delete ${guide.name}`}
                          title={isAr ? 'حذف دليل المقاسات؟' : 'Delete size guide?'}
                          description={isAr ? 'سيتم حذف الدليل نهائياً. لا يمكن التراجع عن هذا الإجراء.' : 'The size guide will be permanently deleted. This cannot be undone.'}
                          confirmLabel={isAr ? 'حذف' : 'Delete'}
                          cancelLabel={isAr ? 'إلغاء' : 'Cancel'}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </ConfirmedSubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {!guides?.length && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-muted-foreground">
                    {isAr ? 'لا توجد أدلة مقاسات.' : 'No size guides found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
