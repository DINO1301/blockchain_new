import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
}

// Hàm chuẩn hóa thời gian GMT+7 định dạng yyyyMMddHHmmss
function formatVNPayDate(date: Date) {
  const offset = 7 * 60 * 60 * 1000; // GMT+7
  const vnTime = new Date(date.getTime() + offset);
  
  const pad = (n: number) => n < 10 ? '0' + n : n.toString();
  
  const year = vnTime.getUTCFullYear();
  const month = pad(vnTime.getUTCMonth() + 1);
  const day = pad(vnTime.getUTCDate());
  const hour = pad(vnTime.getUTCHours());
  const minute = pad(vnTime.getUTCMinutes());
  const second = pad(vnTime.getUTCSeconds());
  
  return `${year}${month}${day}${hour}${minute}${second}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, orderInfo } = await req.json()

    const tmnCode = Deno.env.get('VNPAY_TMN_CODE')
    const secretKey = Deno.env.get('VNPAY_HASH_SECRET')

    if (!tmnCode || !secretKey) {
      throw new Error("Thiếu cấu hình VNPAY_TMN_CODE hoặc VNPAY_HASH_SECRET")
    }

    const vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
    
    // 1. Ép tạo mã đơn hàng hoàn toàn mới (Tránh lỗi trùng mã do test đi test lại)
    const uniqueTxnRef = `SQUAT_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // 2. Tạo giờ chuẩn xác
    const createDate = formatVNPayDate(new Date());

    let vnp_Params: Record<string, string> = {
      'vnp_Version': '2.1.0',
      'vnp_Command': 'pay',
      'vnp_TmnCode': tmnCode,
      'vnp_Locale': 'vn',
      'vnp_CurrCode': 'VND',
      'vnp_TxnRef': uniqueTxnRef,
      'vnp_OrderInfo': orderInfo || 'Nang cap Premium App Squat',
      'vnp_OrderType': 'other',
      'vnp_Amount': (amount * 100).toString(),
      'vnp_ReturnUrl': 'http://localhost:3000/payment-result',
      'vnp_IpAddr': '113.190.232.12', // Sử dụng IP public ảo thay vì 127.0.0.1
      'vnp_CreateDate': createDate,
    }

    vnp_Params = sortObject(vnp_Params)
    const signData = new URLSearchParams(vnp_Params).toString()

    const encoder = new TextEncoder()
    const keyData = encoder.encode(secretKey)
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-512' }, false, ['sign'])
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(signData))
    
    const signed = Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, '0')).join('')

    vnp_Params['vnp_SecureHash'] = signed
    const paymentUrl = `${vnpUrl}?${new URLSearchParams(vnp_Params).toString()}`

    return new Response(JSON.stringify({ paymentUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})

function sortObject(obj: Record<string, string>) {
  const sorted: Record<string, string> = {}
  const keys = Object.keys(obj).sort()
  for (const key of keys) {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+")
  }
  return sorted
}