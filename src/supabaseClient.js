import { createClient } from "@supabase/supabase-js";

// =========================================================================
// SUPABASE CONFIGURATION
// Base Project URL (without '/rest/v1/' or trailing path suffixes) and Key
// =========================================================================

const SUPABASE_URL = "https://ruagizqernsqypujeutu.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_rri7Egy75DKgLgQ2W8kiWA_iwyeHLeC";

// Initialize Supabase client strictly using the base API URL
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
