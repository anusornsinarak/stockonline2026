import { supabase } from './supabaseClient.js';
async function test() {
  const { data } = await supabase.from('survey_submissions').select('*').limit(1);
  console.log(JSON.stringify(data, null, 2));
}
test().catch(console.error);
