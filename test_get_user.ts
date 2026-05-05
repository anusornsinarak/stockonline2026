import { supabase } from './supabaseClient';

async function listUsers() {
  const { data, error } = await supabase.from('users').select('email, username').ilike('email', '%anusorn%');
  console.log(JSON.stringify(data, null, 2));
}
listUsers();
