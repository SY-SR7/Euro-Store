const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function addSettings() {
  const newSettings = [
    { key: 'contact_whatsapp', value: '963000000000', description: 'WhatsApp phone number (digits only, with country code)' },
    { key: 'contact_email', value: 'support@eurostore.com', description: 'Support email address' },
    { key: 'loyalty_redeem_points_per_syp', value: '1', description: 'Points needed to get 1 SYP discount' },
    { key: 'loyalty_referral_bonus_points', value: '50', description: 'Loyalty points for successful referral' },
    { key: 'loyalty_max_redeem_percent', value: '30', description: 'Max % of order total redeemable by points' },
    { key: 'loyalty_earn_amount_syp', value: '1000', description: 'SYP spent to earn points' },
    { key: 'loyalty_earn_points', value: '10', description: 'Points earned per spend cycle' },
  ];
  
  for (const setting of newSettings) {
    const { error } = await supabase
      .from('system_settings')
      .upsert(setting, { onConflict: 'key', ignoreDuplicates: false });
    if (error) {
      console.log('Error for', setting.key, ':', error.message);
    } else {
      console.log('OK:', setting.key);
    }
  }
}

addSettings();
