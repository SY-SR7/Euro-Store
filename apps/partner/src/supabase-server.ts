import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv } from '@eurostore/database';

export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createSupabaseServerClientFromEnv({
    get(name) {
      return cookieStore.get(name)?.value;
    },
    set(name, value, options) {
      try {
        cookieStore.set({ name, value, ...options });
      } catch (_error) {
        // Server Components cannot write cookies; Server Actions and middleware can.
      }
    },
    remove(name, options) {
      try {
        cookieStore.set({ name, value: '', ...options, maxAge: 0 });
      } catch (_error) {
        // Server Components cannot write cookies; Server Actions and middleware can.
      }
    },
  });
}
