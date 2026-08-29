import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const repoDir = path.resolve(appDir, '..', '..');
const statePath = path.join(repoDir, 'output', 'ui-audit-users.json');

config({ path: path.join(appDir, '.env.local') });
config({ path: path.join(repoDir, '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function assertAuditEmail(email) {
  if (!/^codex-ui-audit-[a-z]+-\d+@example\.invalid$/.test(email)) {
    throw new Error(`Refusing to manage an unrecognized audit account: ${email}`);
  }
}

async function createAuthUser(role, stamp, password) {
  const email = `codex-ui-audit-${role}-${stamp}@example.invalid`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role, ui_audit: true },
    user_metadata: { full_name: `Codex UI Audit ${role}` },
  });

  if (error || !data.user) throw error ?? new Error(`Failed to create ${role}`);
  return { id: data.user.id, email, role };
}

async function createCustomerProfile(user) {
  const { error } = await admin.rpc('register_customer_profile', {
    p_customer_id: user.id,
    p_full_name: 'Codex UI Audit Customer',
    p_email: user.email,
    p_phone: '+491111111113',
    p_preferred_language: 'ar',
    p_qr_code_url: null,
    p_referral_code: null,
  });
  if (error) throw error;
}

async function createUsers() {
  try {
    await fs.access(statePath);
    throw new Error(`Audit state already exists at ${statePath}; clean it up first.`);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  const stamp = Date.now();
  const password = `EuroAudit!${stamp}Aa`;
  const users = [];

  try {
    const adminUser = await createAuthUser('admin', stamp, password);
    users.push(adminUser);
    const { error: adminProfileError } = await admin.from('admin_profiles').insert({
      id: adminUser.id,
      email: adminUser.email,
      full_name: 'Codex UI Audit Admin',
      is_active: true,
      totp_enabled: false,
      totp_failed_attempts: 0,
    });
    if (adminProfileError) throw adminProfileError;

    const helperUser = await createAuthUser('helper', stamp, password);
    users.push(helperUser);
    const { error: helperProfileError } = await admin.from('helper_profiles').insert({
      id: helperUser.id,
      email: helperUser.email,
      full_name: 'Codex UI Audit Helper',
      branch_name: 'UI Audit Branch',
      phone: '+491111111111',
      is_active: true,
    });
    if (helperProfileError) throw helperProfileError;

    const partnerUser = await createAuthUser('partner', stamp, password);
    users.push(partnerUser);
    const { error: partnerProfileError } = await admin.from('partner_profiles').insert({
      id: partnerUser.id,
      email: partnerUser.email,
      full_name: 'Codex UI Audit Partner',
      business_name: 'UI Audit Partner',
      contact_name: 'Codex Audit',
      phone: '+491111111112',
      governorate: 'Audit',
      geographic_area: 'Audit',
      address: 'Temporary audit account',
      address_ar: 'حساب تدقيق مؤقت',
      address_en: 'Temporary audit account',
      created_by: adminUser.id,
      is_active: true,
    });
    if (partnerProfileError) throw partnerProfileError;

    const customerUser = await createAuthUser('customer', stamp, password);
    users.push(customerUser);
    await createCustomerProfile(customerUser);

    await fs.mkdir(path.dirname(statePath), { recursive: true });
    await fs.writeFile(statePath, JSON.stringify({ marker: 'eurostore-ui-audit-v1', password, users }, null, 2));
    console.log(JSON.stringify({ statePath, password, users }, null, 2));
  } catch (error) {
    for (const user of users.reverse()) {
      await admin.auth.admin.deleteUser(user.id).catch(() => undefined);
    }
    throw error;
  }
}

async function addCustomer() {
  const state = JSON.parse(await fs.readFile(statePath, 'utf8'));
  if (state.marker !== 'eurostore-ui-audit-v1' || !Array.isArray(state.users)) {
    throw new Error('Refusing to update because the audit state marker is invalid.');
  }
  if (state.users.some((user) => user.role === 'customer')) {
    throw new Error('The audit customer already exists.');
  }

  const stamp = Date.now();
  const customer = await createAuthUser('customer', stamp, state.password);
  try {
    await createCustomerProfile(customer);
    state.users.push(customer);
    await fs.writeFile(statePath, JSON.stringify(state, null, 2));
    console.log(JSON.stringify({ customer }, null, 2));
  } catch (error) {
    await admin.auth.admin.deleteUser(customer.id).catch(() => undefined);
    throw error;
  }
}

async function cleanupUsers() {
  const raw = await fs.readFile(statePath, 'utf8');
  const state = JSON.parse(raw);
  if (state.marker !== 'eurostore-ui-audit-v1' || !Array.isArray(state.users)) {
    throw new Error('Refusing cleanup because the audit state marker is invalid.');
  }

  for (const user of state.users) assertAuditEmail(user.email);

  const byRole = Object.fromEntries(state.users.map((user) => [user.role, user]));
  if (byRole.customer) await admin.from('customer_profiles').delete().eq('id', byRole.customer.id);
  if (byRole.partner) await admin.from('partner_profiles').delete().eq('id', byRole.partner.id);
  if (byRole.helper) await admin.from('helper_profiles').delete().eq('id', byRole.helper.id);
  if (byRole.admin) await admin.from('admin_profiles').delete().eq('id', byRole.admin.id);

  for (const user of [...state.users].reverse()) {
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error && !/not found/i.test(error.message)) throw error;
  }

  await fs.rm(statePath);
  console.log(JSON.stringify({ cleaned: state.users.map(({ id, email, role }) => ({ id, email, role })) }, null, 2));
}

const command = process.argv[2];
if (command === 'create') await createUsers();
else if (command === 'add-customer') await addCustomer();
else if (command === 'cleanup') await cleanupUsers();
else throw new Error('Usage: node scripts/manage-live-ui-audit-users.mjs <create|add-customer|cleanup>');
