// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://gxvompiivgrprpcwnpmn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4dm9tcGlpdmdycHJwY3ducG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyNDcxNjUsImV4cCI6MjA1NjgyMzE2NX0.aqY1PXBhIJOZenow0LCWIFool6Z-F66qCoj0Vu783Nk";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);