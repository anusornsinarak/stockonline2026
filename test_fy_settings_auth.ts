import { supabase } from './supabaseClient.js';
import { supabaseService } from './services/supabaseService.js';
async function test() {
  const { data: { user } } = await supabase.auth.getUser();
  console.log('User:', user?.id);
  const settings = await supabaseService.getFySurveySettings();
  console.log(settings);
}
test().catch(console.error);
