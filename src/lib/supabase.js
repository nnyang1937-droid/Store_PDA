import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const hasPlaceholder =
  !supabaseUrl ||
  !supabaseKey ||
  supabaseUrl.includes('YOUR_PROJECT_REF') ||
  supabaseKey.includes('YOUR_PUBLISHABLE');

export const isSupabaseConfigured = !hasPlaceholder;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const listTable = (storeKey) => `${storeKey}_list`;
export const categoryTable = (storeKey) => `${storeKey}_category`;
