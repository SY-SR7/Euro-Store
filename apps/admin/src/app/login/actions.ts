import { redirect } from 'next/navigation';

export function loginAdminAction(formData: FormData): never {
  void formData;
  redirect('/login');
}

