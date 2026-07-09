import { supabaseService } from './services/supabaseService.js';
supabaseService.getFySurveySettings().then(res => {
  console.log(res);
  console.log('type:', typeof res.fy_survey_open);
}).catch(console.error);
