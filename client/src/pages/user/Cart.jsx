import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { runTransaction, doc, collection, serverTimestamp } from 'firebase/firestore';
import { Trash2, Minus, Plus, ArrowRight, Loader2, ShoppingBag, CreditCard, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, totalAmount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('direct'); // 'direct' or 'online'

  // LOGIC THANH TOÁN (FIFO)
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    const methodText = paymentMethod === 'direct' ? "Trực tiếp tại quầy" : "Thanh toán Online";
    if (!window.confirm(`Xác nhận thanh toán đơn hàng trị giá ${totalAmount.toLocaleString()}đ?\nPhương thức: ${methodText}`)) return;

    setIsProcessing(true);

    try {
      await runTransaction(db, async (transaction) => {
        const orderDetails = []; 
        const productSnapshots = [];

        // BƯỚC 1: ĐỌC TẤT CẢ DỮ LIỆU (READS FIRST)
        for (const item of cartItems) {
          const productRef = doc(db, "products", item.id);
          const productDoc = await transaction.get(productRef);
          
          if (!productDoc.exists()) {
            throw new Error(`Sản phẩm "${item.name}" không tồn tại!`);
          }
          productSnapshots.push({ item, productDoc, productRef });
        }

        // BƯỚC 2: TÍNH TOÁN VÀ GHI DỮ LIỆU (WRITES AFTER ALL READS)
        for (const { item, productDoc, productRef } of productSnapshots) {
          const productData = productDoc.data();
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
          
          transaction.update(productRef, {
            batches: newBatches,
            totalStock: newTotalStock 
          });
        }

        // Tạo Đơn hàng
        const orderRef = doc(collection(db, "orders"));
        transaction.set(orderRef, {
          userId: user.uid,
          userEmail: user.email,
          items: cartItems, 
          batchDetails: orderDetails,
          totalAmount: totalAmount,
          paymentMethod: paymentMethod,
          status: paymentMethod === 'online' ? 'paid' : 'pending',
          createdAt: serverTimestamp()
        });
      });

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
    <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-3 gap-8">
      {/* Cột Trái: Danh sách hàng */}
      <div className="md:col-span-2 space-y-4">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ShoppingBag /> Giỏ hàng của bạn
        </h1>

        {cartItems.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 flex gap-4 items-center shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-gray-800">{item.name}</h3>
              <p className="text-primary font-bold">{item.price.toLocaleString()} ₫</p>
            </div>

            {/* Bộ chỉnh số lượng */}
            <div className="flex items-center gap-3 bg-gray-50 px-3 py-1 rounded-lg border">
              <button 
                onClick={() => updateQuantity(item.id, -1)}
                className="p-1 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-50"
                disabled={item.quantity <= 1}
              >
                <Minus size={14} />
              </button>
              <span className="font-bold w-4 text-center text-sm">{item.quantity}</span>
              <button 
                onClick={() => updateQuantity(item.id, 1)}
                className="p-1 hover:bg-gray-200 rounded text-gray-600"
              >
                <Plus size={14} />
              </button>
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
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('direct')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  paymentMethod === 'direct'
                    ? 'border-primary bg-blue-50 text-primary'
                    : 'border-gray-100 hover:border-gray-200 text-gray-500'
                }`}
              >
                <Wallet size={24} className="mb-1" />
                <span className="text-xs font-bold">Trực tiếp</span>
              </button>

              <button
                onClick={() => setPaymentMethod('online')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  paymentMethod === 'online'
                    ? 'border-primary bg-blue-50 text-primary'
                    : 'border-gray-100 hover:border-gray-200 text-gray-500'
                }`}
              >
                <CreditCard size={24} className="mb-1" />
                <span className="text-xs font-bold">Online</span>
              </button>
            </div>
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
  );
};

export default Cart;