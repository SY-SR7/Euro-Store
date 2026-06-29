export type Locale = 'ar' | 'en';

export const messages: Record<Locale, Record<string, unknown>> = {
  ar: {
    common: {
      appName: 'Euro Store',
      loading: 'جاري التحميل',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      search: 'بحث'
    }
  },
  en: {
    common: {
      appName: 'Euro Store',
      loading: 'Loading',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search'
    }
  }
};

export default messages;