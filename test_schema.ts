import { supabase } from './supabaseClient.js';
async function test() {
  const { data, error } = await supabase.from('system_settings').select('*');
  console.log(data);
}
test().catch(console.error);
