export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ar';

export const messages: Record<Locale, Record<string, unknown>> = {
  ar: {
    common: {
      appName: 'Euro Store',
      loading: 'جاري التحميل',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      search: 'بحث',
      back: 'رجوع',
      next: 'التالي',
      previous: 'السابق',
      submit: 'إرسال',
      success: 'تم بنجاح',
      error: 'حدث خطأ'
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
      search: 'Search',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      success: 'Success',
      error: 'Something went wrong'
    }
  }
};

export default messages;