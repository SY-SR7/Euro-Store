import type { User } from '@supabase/supabase-js';

export function getHelperAccess(user: User | null | undefined): boolean {
  return user?.user_metadata?.role === 'helper' || user?.app_metadata?.role === 'helper';
}

