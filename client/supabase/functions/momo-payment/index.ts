// supabase/functions/momo-payment/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200, 
      headers: corsHeaders 
    })
  }

  try {
    const { amount, orderId, orderInfo } = await req.json()

    // Đảm bảo amount là chuỗi không có phần thập phân
    const amountStr = Math.round(Number(amount)).toString();

    // MOMO CONFIG
    const accessKey = 'F8BBA842ECF85'; 
    const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz'; 
    const partnerCode = 'MOMO'; 
    const redirectUrl = 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b'; // Dùng URL của user để test
    const ipnUrl = 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b'; 
    const requestType = "captureWallet"; // Chuyển sang captureWallet vì đây là chuẩn AIO v2 phổ biến nhất cho web
    const requestId = orderId; 
    const extraData = ''; 

    // 1. Tạo chữ ký (Signature) - Thứ tự tham số rất quan trọng
    const rawSignature = `accessKey=${accessKey}&amount=${amountStr}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    
    console.log("Raw Signature:", rawSignature);
    // Dùng Web Crypto API (chuẩn Deno) để tạo HMAC SHA256
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secretKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(rawSignature)
    );
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // 2. Chuẩn bị Request Body
    const requestBody = {
      partnerCode,
      partnerName: "MediTrack",
      storeId: "MediTrackStore",
      requestId,
      amount: amountStr,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: "vi",
      requestType,
      autoCapture: true,
      extraData,
      signature
    };

    // 3. Gọi MoMo API
    const response = await fetch('https://test-payment.momo.vn/v2/gateway/api/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
