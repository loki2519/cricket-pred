const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function check() {
  const file = fs.readFileSync('./src/lib/supabase.js', 'utf8');
  const urlMatch = file.match(/supabaseUrl\s*=\s*'([^']+)'/);
  const keyMatch = file.match(/supabaseAnonKey\s*=\s*'([^']+)'/);
  if(!urlMatch || !keyMatch) return console.log('Could not parse supabase.js');

  const supabase = createClient(urlMatch[1], keyMatch[1]);
  const { data, error } = await supabase.from('admin_config').select('*');
  console.log('Result:', data, error);
}
check();
