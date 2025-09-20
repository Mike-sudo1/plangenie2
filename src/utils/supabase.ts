import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const SUPABASE_URL =
  (Constants.expoConfig?.extra?.SUPABASE_URL as string | undefined) ??
  'https://eipbppysljtcmqyjuamg.supabase.co';
const SUPABASE_ANON_KEY =
  (Constants.expoConfig?.extra?.SUPABASE_ANON_KEY as string | undefined) ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
