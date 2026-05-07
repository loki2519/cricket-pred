const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const code = fs.readFileSync('src/lib/supabase.js', 'utf8');
const urlMatch = code.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = code.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);

if (!urlMatch || !keyMatch) {
  console.log('Could not find Supabase credentials');
  process.exit(1);
}

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function check() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'maddilokeshreddy19@gmail.com',
    password: '123456'
  });
  console.log('Login attempt:', error ? error.message : 'SUCCESS');

  const { data: configData, error: configError } = await supabase.from('admin_config').select('*');
  console.log('admin_config table:', configData, configError);
}
check();
