// supabase/functions/vnpay-create-payment/index.ts
import { serve } from "https://deno.land/std@0.160.0/http/server.ts";
// Thư viện crypto của Deno để mã hóa dữ liệu
import { HmacSha512 } from "https://deno.land/std@0.160.0/hash/sha512.ts";

serve(async (req) => {
  const testData = "hello from API";
  return new Response(testData, {
    headers: { "Content-Type": "application/json" },
    status: 200
  });
});