export function getHelperAccess(user: any) {
  return user?.user_metadata?.role === 'helper' || user?.app_metadata?.role === 'helper';
}
