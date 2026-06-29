/* eslint-disable */
// @ts-nocheck
'use server';

import { createSupabaseAdminClientFromEnv } from '@eurostore/database';
import { getFormString, loginSchema, registerCustomerSchema } from '@eurostore/shared';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/supabase-server';

function collectLoginForm(formData: FormData) {
  return {
    email: getFormString(formData, 'email'),
    password: getFormString(formData, 'password'),
  };
}

function collectRegisterForm(formData: FormData) {
  return {
    fullName: getFormString(formData, 'fullName'),
    email: getFormString(formData, 'email'),
    phone: getFormString(formData, 'phone'),
    password: getFormString(formData, 'password'),
    preferredLanguage: getFormString(formData, 'preferredLanguage'),
  };
}

export async function loginCustomerAction(formData: FormData): Promise<void> {
  const parsed = loginSchema.safeParse(collectLoginForm(formData));

  if (!parsed.success) {
    redirect('/auth/login?status=invalid');
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect('/auth/login?status=failed');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?status=failed');
  }

  const profile = await supabase
    .from('customer_profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile.data) {
    await supabase.auth.signOut();
    redirect('/auth/login?status=failed');
  }

  redirect('/');
}

export async function registerCustomerAction(formData: FormData): Promise<void> {
  const parsed = registerCustomerSchema.safeParse(collectRegisterForm(formData));

  if (!parsed.success) {
    redirect('/auth/register?status=invalid');
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        preferred_language: parsed.data.preferredLanguage,
      },
    },
  });

  if (error) {
    redirect('/auth/register?status=failed');
  }

  if (!data.user) {
    redirect('/auth/register?status=failed');
  }

  const phone = parsed.data.phone === '' || parsed.data.phone === undefined ? null : parsed.data.phone;
  const admin = createSupabaseAdminClientFromEnv();
  const { error: profileError } = await admin.from('customer_profiles').upsert({
    id: data.user.id,
    full_name: parsed.data.fullName,
    email: parsed.data.email,
    phone,
    preferred_language: parsed.data.preferredLanguage,
  });

  if (profileError) {
    await supabase.auth.signOut();
    redirect('/auth/register?status=failed');
  }

  redirect('/auth/login?status=registered');
}

export async function login(_formData: FormData): Promise<void> {
  return;
}
export async function register(_formData: FormData): Promise<void> {
  return;
}
