import { createClient } from '@supabase/supabase-js';

// Thay thế các giá trị này bằng thông tin từ Supabase Dashboard của bạn
// Project Settings -> API
const supabaseUrl = 'https://vkrqhkedchmwviorhtwu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcnFoa2VkY2htd3Zpb3JodHd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNTczMjksImV4cCI6MjA4NzkzMzMyOX0.evUYlyrC03152ZJ5c-gQuQusJVXHptjLW2_LU4ksUkI'; // Bạn hãy copy mã đầy đủ từ ô Publishable key và dán đè vào đây nếu mã này chưa đủ dài

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
