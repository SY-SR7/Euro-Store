const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...vals] = line.split('=');
    if (key) env[key.trim()] = vals.join('=').trim().replace(/^"/, '').replace(/"$/, '');
  }
});

const { createServerClient } = require('@supabase/ssr');

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let capturedCookies = [];
const supabase = createServerClient(supabaseUrl, supabaseAnon, {
  cookies: {
    getAll() { return []; },
    setAll(cookies) {
      capturedCookies = cookies;
    }
  }
});

supabase.auth.signInWithPassword({
  email: 'eurostore.private@gmail.com',
  password: '<$t0rEeurOo>'
}).then(res => {
  console.log('Login result:', res.error ? res.error.message : 'Success');
  console.log('Cookies captured:', JSON.stringify(capturedCookies, null, 2));
});
