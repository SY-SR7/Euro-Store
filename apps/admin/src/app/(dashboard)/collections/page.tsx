import { Plus, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';
import ConfirmedSubmitButton from '../../components/ConfirmedSubmitButton';

export default async function CollectionsPage() {
  const isAr = await getLocale() === 'ar';
  const ctx = await requireAdminContext('collection_management', 'view');
  if (!ctx) redirect('/login');
  const { data: collections } = await ctx.admin
    .from('collections')
    .select('*')
    .order('sort_order', { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isAr ? 'إدارة المجموعات' : 'Collections Management'}</h1>
        <Link
          href="/collections/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          {isAr ? 'إضافة مجموعة' : 'Add Collection'}
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">{isAr ? 'الاسم بالإنجليزية' : 'Name (EN)'}</th>
                <th className="p-4 font-medium">{isAr ? 'الاسم بالعربية' : 'Name (AR)'}</th>
                <th className="p-4 font-medium">{isAr ? 'المعرّف' : 'Slug'}</th>
                <th className="p-4 font-medium">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="p-4 font-medium">{isAr ? 'مميزة' : 'Featured'}</th>
                <th className="p-4 text-right font-medium">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {collections?.map((col) => (
                <tr key={col.id} className="hover:bg-muted/50">
                  <td className="p-4 font-medium">{col.name_en}</td>
                  <td className="p-4">{col.name_ar}</td>
                  <td className="p-4 font-mono text-xs">{col.slug}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${col.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {col.is_active ? (isAr ? 'نشطة' : 'Active') : (isAr ? 'غير نشطة' : 'Inactive')}
                    </span>
                  </td>
                  <td className="p-4">
                    {col.is_featured_on_homepage ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/collections/${col.id}`} aria-label={isAr ? `تعديل ${col.name_ar}` : `Edit ${col.name_en}`} title={isAr ? 'تعديل' : 'Edit'} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Edit2 className="h-4 w-4" />
                      </Link>
                      <form action={async () => {
                        'use server';
                        const actionCtx = await requireAdminContext('collection_management', 'delete');
                        if (!actionCtx) return;
                        const { data: before } = await actionCtx.admin.from('collections').select('*').eq('id', col.id).maybeSingle();
                        await actionCtx.admin.from('collections').delete().eq('id', col.id);
                        await writeAuditLog({ admin: actionCtx.admin, actorId: actionCtx.userId, actorRole: actionCtx.role, action: 'collection.deleted', entityType: 'collections', entityId: col.id, beforeState: before });
                        const { revalidatePath } = await import('next/cache');
                        revalidatePath('/collections');
                      }}>
                        <ConfirmedSubmitButton
                          ariaLabel={isAr ? `حذف ${col.name_ar}` : `Delete ${col.name_en}`}
                          title={isAr ? 'حذف المجموعة؟' : 'Delete collection?'}
                          description={isAr ? 'سيتم حذف المجموعة وربطها بالمنتجات نهائياً. لا يمكن التراجع عن هذا الإجراء.' : 'The collection and its product links will be permanently deleted. This cannot be undone.'}
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
              {!collections?.length && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    {isAr ? 'لا توجد مجموعات.' : 'No collections found.'}
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
