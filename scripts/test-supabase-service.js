#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function parseEnvFile(p) {
  if (!fs.existsSync(p)) return {};
  const content = fs.readFileSync(p, 'utf8');
  return content.split(/\r?\n/).reduce((m, l) => {
    const t = l.trim();
    if (!t || t.startsWith('#')) return m;
    const i = t.indexOf('=');
    if (i === -1) return m;
    m[t.slice(0, i)] = t.slice(i + 1);
    return m;
  }, {});
}

async function run() {
  const env = parseEnvFile(path.resolve(process.cwd(), '.env.local'));
  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE;

  if (!url || !serviceKey) {
    console.error('MISSING_SERVICE_KEY');
    process.exit(2);
  }

  const supabase = createClient(url, serviceKey);

  try {
    console.log('Testing service-role client for stores...');
    const { data, error, status } = await supabase.from('stores').select('id').limit(1);
    console.log('status:', status);
    if (error) {
      console.error('ERROR:', error.message || error);
      process.exit(3);
    }
    console.log('OK, rows:', Array.isArray(data) ? data.length : typeof data);
    process.exit(0);
  } catch (err) {
    console.error('UNEXPECTED', String(err));
    process.exit(4);
  }
}

run();
