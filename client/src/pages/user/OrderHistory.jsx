import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Package, Calendar, ChevronDown, ChevronUp, ExternalLink, Clock, CheckCircle, Truck, CreditCard, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

const OrderHistory = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null); // Để mở rộng xem chi tiết đơn

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        // Lấy đơn hàng của user hiện tại, sắp xếp mới nhất lên đầu
        const q = query(
          collection(db, "orders"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const orderList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(orderList);
      } catch (error) {
        console.error("Lỗi tải đơn hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // Helper: Format ngày
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp.seconds * 1000).toLocaleString('vi-VN');
  };

  // Helper: Màu trạng thái
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'paid': return 'bg-blue-100 text-blue-700';
      case 'shipping': return 'bg-blue-100 text-blue-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'paid': return 'Đã thanh toán (Online)';
      case 'shipping': return 'Đang giao';
      default: return 'Chờ xử lý';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Package className="text-primary"/> Đơn Hàng Của Tôi
      </h1>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-10 rounded-xl text-center border border-dashed">
          <p className="text-gray-500 mb-4">Bạn chưa có đơn hàng nào.</p>
          <Link to="/" className="text-primary font-bold hover:underline">Đi mua sắm ngay</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
              
              {/* Header Đơn hàng (Luôn hiện) */}
              <div 
                className="p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer bg-gray-50"
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${getStatusColor(order.status)}`}>
                    {order.status === 'completed' ? <CheckCircle size={20}/> : 
                     order.status === 'shipping' || order.status === 'paid' ? <Truck size={20}/> : <Clock size={20}/>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-800">Đơn #{order.id.slice(0, 8).toUpperCase()}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar size={12}/> {formatDate(order.createdAt)}
                      </p>
                      <span className="text-xs text-gray-400 border-l pl-3 flex items-center gap-1">
                        {order.paymentMethod === 'online' ? (
                          <><CreditCard size={12}/> Thẻ Online</>
                        ) : order.paymentMethod === 'direct' ? (
                          <><Wallet size={12}/> Tiền mặt</>
                        ) : (
                          <><Wallet size={12}/> Chưa rõ PT</>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-3 md:mt-0">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Tổng tiền</p>
                    <p className="font-bold text-primary">{order.totalAmount?.toLocaleString()} ₫</p>
                  </div>
                  {expandedOrder === order.id ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
                </div>
              </div>

              {/* Chi tiết Đơn hàng (Khi bấm vào mới hiện) */}
              {expandedOrder === order.id && (
                <div className="p-4 border-t bg-white animate-in slide-in-from-top-2">
                  <h4 className="font-bold text-sm text-gray-700 mb-3 uppercase tracking-wide">Chi tiết nguồn gốc (Tracking)</h4>
                  
                  <div className="space-y-3">
                    {/* Duyệt qua từng sản phẩm được hệ thống FIFO tách ra */}
                    {order.batchDetails?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-indigo-100 bg-indigo-50/50">
                        <div>
                          <p className="font-bold text-gray-800">{item.productName}</p>
                          <p className="text-xs text-gray-500">Số lượng: <span className="font-bold">{item.quantityTaken}</span> hộp</p>
                        </div>
                        
                        {/* LINK SANG TRANG TRACKING */}
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <span className="block text-[10px] text-gray-400 uppercase">Xuất xứ từ lô</span>
                                <span className="font-mono font-bold text-indigo-600">Batch #{item.batchId}</span>
                            </div>
                            <Link 
                                to={`/tracking?id=${item.batchId}`} // Truyền ID qua URL luôn cho tiện
                                className="p-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-600 hover:text-white transition"
                                title="Xem nguồn gốc lô này"
                            >
                                <ExternalLink size={18} />
                            </Link>
                        </div>
                      </div>
                    ))}
                  </div>

                  {(!order.batchDetails || order.batchDetails.length === 0) && (
                     <p className="text-sm text-gray-400 italic">Đơn hàng cũ, không có thông tin lô.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;