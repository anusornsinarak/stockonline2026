// @ts-nocheck
import { supabase } from './supabaseClient.js';
async function test() {
  const dept = await supabase.from('departments').select('id').limit(1).single();
  if (!dept.data) return console.log('no dept');
  
  const res1 = await supabase.from('survey_submissions').insert({ department_id: dept.data.id, quantities: { a: 1 } });
  console.log('insert 1', res1.error);
  
  const res2 = await supabase.from('survey_submissions').insert({ department_id: dept.data.id, quantities: { b: 2 } });
  console.log('insert 2', res2.error);
  
  const { data } = await supabase.from('survey_submissions').select('*').eq('department_id', dept.data.id);
  console.log('count:', data?.length);
  
  await supabase.from('survey_submissions').delete().eq('department_id', dept.data.id);
}
test().catch(console.error);
