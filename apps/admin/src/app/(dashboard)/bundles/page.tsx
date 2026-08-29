import { Plus, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';
import ConfirmedSubmitButton from '../../components/ConfirmedSubmitButton';

export default async function BundlesPage() {
  const isAr = await getLocale() === 'ar';
  const ctx = await requireAdminContext('bundle_management', 'view');
  if (!ctx) redirect('/login');
  const { data: bundles } = await ctx.admin
    .from('product_bundles')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isAr ? 'حزم المنتجات' : 'Product Bundles'}</h1>
        <Link
          href="/bundles/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          {isAr ? 'إنشاء حزمة' : 'Create Bundle'}
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">{isAr ? 'الاسم بالإنجليزية' : 'Name (EN)'}</th>
                <th className="p-4 font-medium">{isAr ? 'الاسم بالعربية' : 'Name (AR)'}</th>
                <th className="p-4 font-medium">{isAr ? 'سعر الحزمة (ل.س)' : 'Bundle Price (SYP)'}</th>
                <th className="p-4 font-medium">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="p-4 text-right font-medium">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bundles?.map((bundle) => (
                <tr key={bundle.id} className="hover:bg-muted/50">
                  <td className="p-4 font-medium">{bundle.name_en}</td>
                  <td className="p-4">{bundle.name_ar}</td>
                  <td className="p-4 font-mono">{Number(bundle.bundle_price ?? 0).toLocaleString('en-US')} SYP</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${bundle.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'}`}>
                      {bundle.status === 'published' ? (isAr ? 'منشورة' : 'Published') : bundle.status === 'archived' ? (isAr ? 'مؤرشفة' : 'Archived') : (isAr ? 'مسودة' : 'Draft')}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/bundles/${bundle.id}`} aria-label={isAr ? `تعديل ${bundle.name_ar}` : `Edit ${bundle.name_en}`} title={isAr ? 'تعديل' : 'Edit'} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Edit2 className="h-4 w-4" />
                      </Link>
                      <form action={async () => {
                        'use server';
                        const actionCtx = await requireAdminContext('bundle_management', 'delete');
                        if (!actionCtx) return;
                        const { data: before } = await actionCtx.admin.from('product_bundles').select('*, bundle_items(*)').eq('id', bundle.id).maybeSingle();
                        await actionCtx.admin.from('product_bundles').delete().eq('id', bundle.id);
                        await writeAuditLog({ admin: actionCtx.admin, actorId: actionCtx.userId, actorRole: actionCtx.role, action: 'bundle.deleted', entityType: 'product_bundles', entityId: bundle.id, beforeState: before });
                        const { revalidatePath } = await import('next/cache');
                        revalidatePath('/bundles');
                      }}>
                        <ConfirmedSubmitButton
                          ariaLabel={isAr ? `حذف ${bundle.name_ar}` : `Delete ${bundle.name_en}`}
                          title={isAr ? 'حذف الحزمة؟' : 'Delete bundle?'}
                          description={isAr ? 'سيتم حذف الحزمة وعناصرها نهائياً. لا يمكن التراجع عن هذا الإجراء.' : 'The bundle and its items will be permanently deleted. This cannot be undone.'}
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
              {!bundles?.length && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    {isAr ? 'لا توجد حزم.' : 'No bundles found.'}
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
