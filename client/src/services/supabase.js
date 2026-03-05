import { createClient } from '@supabase/supabase-js';

// Thay thế các giá trị này bằng thông tin từ Supabase Dashboard của bạn
// Project Settings -> API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ THIẾU BIẾN MÔI TRƯỜNG SUPABASE! Hãy kiểm tra file .env hoặc cấu hình trên Vercel.");
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');
