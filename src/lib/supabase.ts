import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Complaint = {
  id: string;
  date: string;
  time_of_issue?: string;
  time_of_repair?: string;
  user_name: string;
  complaint: string;
  category: string;
  room_number: string;
  issue?: string;
  solution?: string;
  admin_name: string;
  pic?: string;
  status: 'late' | 'ontime';
  created_at: string;
};
