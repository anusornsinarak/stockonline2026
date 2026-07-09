import { supabase } from './supabaseClient.js';
async function test() {
  const { count } = await supabase.from('survey_submissions').select('*', { count: 'exact' });
  console.log('Count:', count);
}
test().catch(console.error);
