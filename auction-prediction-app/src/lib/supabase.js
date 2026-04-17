import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://erusborhcofvshrxidvw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVydXNib3JoY29mdnNocnhpZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODQ3MDIsImV4cCI6MjA5MTA2MDcwMn0.7NPDL-_FGmfb-qcHHWDjF_84I4nWQlk3apPVSNSFqCc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'implicit',   // avoids PKCE code_verifier issues on React Native
  },
});
