
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://cgxttmtfdqxubwlposqg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNneHR0bXRmZHF4dWJ3bHBvc3FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NjAxMzksImV4cCI6MjA1OTAzNjEzOX0.wPPCh8eQPw2GR-FT_OxPNgAYbrH0vLz0gJMcieQD9QE";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);
