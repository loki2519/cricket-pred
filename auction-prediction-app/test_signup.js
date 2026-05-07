const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const code = fs.readFileSync('src/lib/supabase.js', 'utf8');
const urlMatch = code.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = code.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function check() {
  const { data, error } = await supabase.auth.signUp({
    email: 'maddilokeshreddy19@gmail.com',
    password: '123456'
  });
  console.log('Register attempt:', error ? error.message : 'SUCCESS');
  
  if (!error) {
     const { data: d2, error: e2 } = await supabase.auth.signInWithPassword({
        email: 'maddilokeshreddy19@gmail.com',
        password: '123456'
     });
     console.log('Login after register attempt:', e2 ? e2.message : 'SUCCESS');
     
     if (!e2) {
       const { error: e3 } = await supabase.from('admin_config').insert({ id: 1, admin_email: 'maddilokeshreddy19@gmail.com', admin_password: '123456' });
       console.log('Insert admin config attempt:', e3 ? e3.message : 'SUCCESS');
     }
  }
}
check();
