import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { Trash2, Minus, Plus, ArrowRight, Loader2, ShoppingBag, CreditCard, Wallet, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, totalAmount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // { type: 'success' | 'error' | 'cancel', message: string }
  const [paymentMethod, setPaymentMethod] = useState('direct'); // 'direct', 'online'
  const [onlineProvider, setOnlineProvider] = useState('momo'); // Mặc định là momo khi chọn online

  // Xử lý khi trang được khôi phục từ cache trình duyệt (nút Back)
  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        setIsProcessing(false);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  // Xử lý kết quả trả về từ MoMo
  useEffect(() => {
    const resultCode = searchParams.get('resultCode');
    const orderId = searchParams.get('orderId');

    if (resultCode !== null) {
      console.log("MoMo Result:", resultCode, "Order:", orderId);
      setIsProcessing(false); 
      
      if (resultCode === '0') {
        setPaymentStatus({
          type: 'success',
          message: 'Thanh toán MoMo thành công! Đơn hàng của bạn đang được xử lý.'
        });
        clearCart();
        setTimeout(() => navigate('/orders'), 3000);
      } else if (resultCode === '1006' || resultCode === '1005') {
        setPaymentStatus({
          type: 'cancel',
          message: 'Giao dịch đã bị hủy. Bạn có thể thử lại hoặc chọn phương thức khác.'
        });
      } else {
        setPaymentStatus({
          type: 'error',
          message: `Giao dịch không thành công (Mã lỗi: ${resultCode}). Vui lòng thử lại.`
        });
      }

      // Xóa params bằng React Router thay vì window.history
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, clearCart, navigate]);

  // LOGIC THANH TOÁN (FIFO)
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    let methodText = "";
    if (paymentMethod === 'direct') {
      methodText = "Trực tiếp tại quầy";
    } else {
      methodText = onlineProvider === 'momo' ? "Ví điện tử MoMo" : "Thanh toán Online";
    }

    if (!window.confirm(`Xác nhận thanh toán đơn hàng trị giá ${totalAmount.toLocaleString()}đ?\nPhương thức: ${methodText}`)) return;

    setIsProcessing(true);
    setPaymentStatus(null); 

    if (paymentMethod === 'online' && onlineProvider === 'momo') {
      try {
        // Tạo orderId ngắn gọn hơn và độc nhất
        const orderId = "MT" + Math.floor(Date.now() / 1000); 
        const { data, error } = await supabase.functions.invoke('momo-payment', {
          body: { 
            amount: totalAmount, 
            orderId: orderId,
            orderInfo: `Thanh toan don hang MediTrack #${orderId}`,
            redirectUrl: window.location.origin + window.location.pathname
          }
        });

        if (error) throw error;
        
        if (data && data.payUrl) {
          window.location.href = data.payUrl;
          return;
        } else {
          throw new Error(data?.message || "Không nhận được link thanh toán MoMo");
        }
      } catch (err) {
        console.error("Lỗi MoMo:", err);
        setPaymentStatus({
          type: 'error',
          message: "Lỗi kết nối MoMo: " + err.message
        });
        setIsProcessing(false);
        return;
      }
    }

    try {
      const orderDetails = []; 
      const productUpdates = [];

      // BƯỚC 1: ĐỌC VÀ TÍNH TOÁN
      for (const item of cartItems) {
        const { data: productData, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .eq('id', item.id)
          .single();
        
        if (fetchError || !productData) {
          throw new Error(`Sản phẩm "${item.name}" không tồn tại!`);
        }

        let currentBatches = productData.batches || [];
        let remainingQtyToBuy = item.quantity;
        const newBatches = [];
        
        for (const batch of currentBatches) {
          const currentQty = Number(batch.qty); 
          
          if (remainingQtyToBuy > 0 && currentQty > 0) {
            const take = Math.min(currentQty, remainingQtyToBuy);
            
            orderDetails.push({
              productId: item.id,
              productName: item.name,
              batchId: batch.id,
              quantityTaken: take
            });

            remainingQtyToBuy -= take;
            newBatches.push({ ...batch, qty: currentQty - take });
          } else {
            newBatches.push(batch);
          }
        }

        if (remainingQtyToBuy > 0) {
           throw new Error(`Sản phẩm "${item.name}" không đủ hàng (Thiếu ${remainingQtyToBuy} hộp)!`);
        }

        const newTotalStock = newBatches.reduce((sum, b) => sum + Number(b.qty), 0);
        
        productUpdates.push({
          id: item.id,
          batches: newBatches,
          total_stock: newTotalStock
        });
      }

      // BƯỚC 2: CẬP NHẬT DATABASE
      // 2.1 Cập nhật từng sản phẩm
      for (const update of productUpdates) {
        const { error: updateError } = await supabase
          .from('products')
          .update({
            batches: update.batches,
            total_stock: update.total_stock
          })
          .eq('id', update.id);
        
        if (updateError) throw updateError;
      }

      // 2.2 Tạo Đơn hàng
      const { error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          user_email: user.email,
          items: cartItems, 
          batch_details: orderDetails,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          status: (paymentMethod === 'online' || paymentMethod === 'vnpay') ? 'paid' : 'pending',
          created_at: new Date().toISOString()
        }]);

      if (orderError) throw orderError;

      alert("✅ Đặt hàng thành công! Kho đã được cập nhật.");
      clearCart(); 
      navigate('/orders'); 

    } catch (error) {
      console.error(error);
      alert("❌ Lỗi thanh toán: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-10 text-center">
        {/* Vẫn hiển thị thông báo trạng thái thanh toán ngay cả khi giỏ hàng trống (sau khi thành công) */}
        {paymentStatus && (
          <div className={`mb-10 p-5 rounded-3xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-500 shadow-xl ${
            paymentStatus.type === 'success' ? 'bg-green-50 border-2 border-green-200 text-green-800' :
            paymentStatus.type === 'cancel' ? 'bg-amber-50 border-2 border-amber-200 text-amber-800' :
            'bg-red-50 border-2 border-red-200 text-red-800'
          }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              paymentStatus.type === 'success' ? 'bg-green-200' :
              paymentStatus.type === 'cancel' ? 'bg-amber-200' :
              'bg-red-200'
            }`}>
              {paymentStatus.type === 'success' ? <CheckCircle2 size={32} className="text-green-700" /> :
               paymentStatus.type === 'cancel' ? <AlertCircle size={32} className="text-amber-700" /> :
               <XCircle size={32} className="text-red-700" />}
            </div>
            <div className="max-w-sm">
              <h4 className="font-black text-2xl mb-1">
                {paymentStatus.type === 'success' ? 'Thanh toán thành công!' :
                 paymentStatus.type === 'cancel' ? 'Đã hủy giao dịch' :
                 'Lỗi thanh toán'}
              </h4>
              <p className="text-sm font-bold opacity-80">{paymentStatus.message}</p>
            </div>
            {paymentStatus.type === 'success' && (
              <div className="w-full h-1.5 bg-green-100 rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-green-500 animate-[progress_3s_linear_forwards]" />
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag size={40} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Giỏ hàng trống</h2>
        <p className="text-gray-500 mb-6">Bạn chưa thêm sản phẩm nào vào giỏ.</p>
        <Link to="/" className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition">
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Thông báo trạng thái thanh toán */}
      {paymentStatus && (
        <div className={`mb-6 p-4 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500 ${
          paymentStatus.type === 'success' ? 'bg-green-50 border-2 border-green-100 text-green-700' :
          paymentStatus.type === 'cancel' ? 'bg-amber-50 border-2 border-amber-100 text-amber-700' :
          'bg-red-50 border-2 border-red-100 text-red-700'
        }`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
            paymentStatus.type === 'success' ? 'bg-green-100' :
            paymentStatus.type === 'cancel' ? 'bg-amber-100' :
            'bg-red-100'
          }`}>
            {paymentStatus.type === 'success' ? <CheckCircle2 className="text-green-600" /> :
             paymentStatus.type === 'cancel' ? <AlertCircle className="text-amber-600" /> :
             <XCircle className="text-red-600" />}
          </div>
          <div>
            <h4 className="font-bold text-lg">
              {paymentStatus.type === 'success' ? 'Thành công!' :
               paymentStatus.type === 'cancel' ? 'Đã hủy giao dịch' :
               'Lỗi thanh toán'}
            </h4>
            <p className="text-sm opacity-90 font-medium">{paymentStatus.message}</p>
          </div>
          <button 
            onClick={() => setPaymentStatus(null)}
            className="ml-auto p-2 hover:bg-black/5 rounded-lg transition"
          >
            <XCircle size={20} className="opacity-40" />
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
      {/* Cột Trái: Danh sách hàng */}
      <div className="md:col-span-2 space-y-4">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ShoppingBag /> Giỏ hàng của bạn
        </h1>

        {cartItems.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 flex gap-4 items-center shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
              <img src={item.image_url || item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-gray-800">{item.name}</h3>
              <p className="text-primary font-bold">{item.price.toLocaleString()} ₫</p>
              <p className="text-[10px] text-gray-400">Kho còn: <span className="font-bold">{item.total_stock || 0}</span></p>
            </div>

            {/* Bộ chỉnh số lượng */}
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-3 bg-gray-50 px-3 py-1 rounded-lg border">
                <button 
                  onClick={() => updateQuantity(item.id, -1)}
                  className="p-1 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-50"
                  disabled={item.quantity <= 1}
                >
                  <Minus size={14} />
                </button>
                <input 
                  type="text"
                  className="w-12 text-center bg-transparent font-bold text-sm outline-none"
                  value={item.quantity}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    const num = parseInt(val || 0);
                    const stock = Number(item.total_stock || 0);
                    
                    if (num > stock) {
                      updateQuantity(item.id, stock - item.quantity);
                    } else if (num >= 0) {
                      updateQuantity(item.id, num - item.quantity);
                    }
                  }}
                />
                <button 
                  onClick={() => updateQuantity(item.id, 1)}
                  className="p-1 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-50"
                  disabled={item.quantity >= (item.total_stock || 0)}
                >
                  <Plus size={14} />
                </button>
              </div>
              {item.quantity >= (item.total_stock || 0) && (
                <span className="text-[9px] text-red-500 font-bold italic">Tối đa trong kho</span>
              )}
            </div>

            <button 
              onClick={() => removeFromCart(item.id)}
              className="p-2 text-gray-400 hover:text-red-500 transition"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>

      {/* Cột Phải: Tổng tiền & Thanh toán */}
      <div className="md:col-span-1">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-24">
          <h2 className="text-lg font-bold mb-4">Tóm tắt đơn hàng</h2>
          
          <div className="space-y-3 border-b pb-4 mb-4">
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính</span>
              <span>{totalAmount.toLocaleString()} ₫</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Phí vận chuyển</span>
              <span>Miễn phí</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Phương thức thanh toán</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setPaymentMethod('direct')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                  paymentMethod === 'direct'
                    ? 'border-primary bg-blue-50 text-primary'
                    : 'border-gray-100 hover:border-gray-200 text-gray-500'
                }`}
              >
                <Wallet size={28} className="mb-2" />
                <span className="text-xs font-black uppercase tracking-tight">Trực tiếp</span>
              </button>

              <button
                onClick={() => setPaymentMethod('online')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                  paymentMethod === 'online'
                    ? 'border-primary bg-blue-50 text-primary'
                    : 'border-gray-100 hover:border-gray-200 text-gray-500'
                }`}
              >
                <CreditCard size={28} className="mb-2" />
                <span className="text-xs font-black uppercase tracking-tight">Thẻ Online</span>
              </button>
            </div>

            {/* Phương thức con khi chọn Online */}
            {paymentMethod === 'online' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Chọn cổng thanh toán</h4>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => setOnlineProvider('momo')}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${
                      onlineProvider === 'momo'
                        ? 'border-[#A50064] bg-pink-50'
                        : 'border-gray-50 hover:border-gray-100 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#A50064] text-white flex items-center justify-center rounded-xl text-[10px] font-black italic shadow-sm">MoMo</div>
                      <div className="text-left">
                        <p className={`text-sm font-black ${onlineProvider === 'momo' ? 'text-[#A50064]' : 'text-gray-700'}`}>Ví điện tử MoMo</p>
                        <p className="text-[10px] text-gray-400 font-bold">Thanh toán an toàn qua MoMo</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      onlineProvider === 'momo' ? 'border-[#A50064] bg-[#A50064]' : 'border-gray-200'
                    }`}>
                      {onlineProvider === 'momo' && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </button>

                  {/* Thêm các cổng khác ở đây trong tương lai */}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between text-xl font-bold text-gray-800 mb-6">
            <span>Tổng cộng</span>
            <span className="text-primary">{totalAmount.toLocaleString()} ₫</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isProcessing}
            className="w-full bg-primary hover:bg-blue-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : <>Thanh toán ngay <ArrowRight size={20}/></>}
          </button>
          
          <p className="text-xs text-gray-400 text-center mt-4">
            *Hệ thống sẽ tự động chọn lô thuốc có hạn sử dụng tốt nhất cho bạn.
          </p>
        </div>
      </div>
    </div>
  </div>
);
};

export default Cart;