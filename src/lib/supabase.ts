import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Complaint = {
  id: string;
  date: string;
  user_name: string;
  complaint: string;
  category: string;
  room_number: string;
  admin_name: string;
  status: 'late' | 'done';
  created_at: string;
  solution?: string;
};
