import { redirect } from 'next/navigation';

export interface TotpSetupState {
  accountName: string;
  issuer: string;
  secret: string;
  uri: string;
}

export function getOrCreateTotpSetup(): never {
  redirect('/totp/setup');
}

export function verifyTotpAction(formData: FormData): never {
  void formData;
  redirect('/totp/verify');
}

