import { supabase } from './supabaseClient.js';
async function run() {
  const { data, error } = await supabase.rpc('execute_sql', { sql_statement: `
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'survey_submissions'::regclass AND contype = 'u';
  `});
  console.log(data, error);
}
run();
