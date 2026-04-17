import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { Package, Calendar, ChevronDown, ChevronUp, ExternalLink, Clock, CheckCircle, Truck, CreditCard, Wallet, Loader2, User as UserIcon, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const OrderHistory = () => {
  const { user, role } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [filterDate, setFilterDate] = useState(''); // YYYY-MM-DD
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 6;

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      let query = supabase.from('orders').select('*');
      
      // Nếu không phải admin, chỉ lấy đơn của chính mình
      if (role !== 'admin') {
        query = query.eq('user_id', user.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user, role]);

  const confirmCashPayment = async (e, orderId) => {
    e.stopPropagation();
    if (!window.confirm("Xác nhận đơn hàng này đã được thanh toán bằng tiền mặt?")) return;
    
    setProcessingId(orderId);
    try {
      const { data, error, status: resStatus } = await supabase
        .from('orders')
        .update({ status: 'paid_cash' })
        .eq('id', orderId)
        .select(); // Thêm .select() để kiểm tra xem dữ liệu có thực sự được cập nhật không
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error("Không tìm thấy đơn hàng để cập nhật hoặc bạn không có quyền (RLS).");
      }
      
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'paid_cash' } : o));
      alert("✅ Đã xác nhận thanh toán tiền mặt thành công và lưu vào hệ thống!");
    } catch (error) {
      console.error("Lỗi xác nhận thanh toán:", error);
      alert("❌ Lỗi: " + (error.message || "Không thể cập nhật cơ sở dữ liệu. Vui lòng kiểm tra quyền Admin trong Supabase (RLS)."));
    } finally {
      setProcessingId(null);
    }
  };

  // Lọc đơn hàng theo ngày nếu có chọn
  const filteredOrders = orders.filter(order => {
    if (!filterDate) return true;
    const orderDate = new Date(order.created_at).toISOString().split('T')[0];
    return orderDate === filterDate;
  });

  const totalFilteredAmount = filteredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  // Phân trang
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset trang khi lọc ngày
  useEffect(() => {
    setCurrentPage(1);
  }, [filterDate]);

  // Helper: Format ngày
  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('vi-VN');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'paid': return 'bg-blue-100 text-blue-700';
      case 'paid_online': return 'bg-indigo-100 text-indigo-700';
      case 'paid_cash': return 'bg-emerald-100 text-emerald-700';
      case 'shipping': return 'bg-blue-100 text-blue-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'paid': return 'Đã thanh toán (Online)';
      case 'paid_online': return 'Đã thanh toán Online thành công';
      case 'paid_cash': return 'Đã thanh toán thành công';
      case 'shipping': return 'Đang giao';
      default: return 'Chờ xử lý';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="text-primary"/> {role === 'admin' ? 'Quản Lý Đơn Hàng' : 'Đơn Hàng Của Tôi'}
        </h1>
        
        <div className="flex items-center gap-4">
          {role === 'admin' && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-500">Lọc theo ngày:</span>
              <input 
                type="date"
                className="px-4 py-2 bg-white border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary shadow-sm"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
              {filterDate && (
                <button 
                  onClick={() => setFilterDate('')}
                  className="text-xs text-red-500 hover:underline font-bold"
                >
                  Xóa lọc
                </button>
              )}
            </div>
          )}
          <button 
            onClick={fetchOrders}
            className="text-sm text-primary hover:underline font-medium"
          >
            Làm mới
          </button>
        </div>
      </div>

      {role === 'admin' && filterDate && (
        <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl text-primary shadow-sm">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Thống kê ngày {new Date(filterDate).toLocaleDateString('vi-VN')}</p>
              <p className="text-sm font-black text-gray-800">Có {filteredOrders.length} đơn hàng - Tổng: <span className="text-primary">{totalFilteredAmount.toLocaleString()} ₫</span></p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={40}/>
          <p className="text-gray-500 font-medium">Đang tải dữ liệu đơn hàng...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white p-20 rounded-2xl text-center border-2 border-dashed border-gray-100">
          <Package size={48} className="mx-auto text-gray-200 mb-4"/>
          <p className="text-gray-400 font-medium italic">
            {filterDate ? `Không có đơn hàng nào trong ngày ${new Date(filterDate).toLocaleDateString('vi-VN')}.` : 'Chưa có đơn hàng nào.'}
          </p>
          {!filterDate && <Link to="/" className="text-primary font-bold hover:underline mt-4 inline-block">Đi mua sắm ngay</Link>}
        </div>
      ) : (
        <div className="space-y-4">
          {currentOrders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              
              {/* Header Đơn hàng (Luôn hiện) */}
              <div 
                className="p-5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer bg-white"
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-5">
                  <div className={`p-3 rounded-2xl ${getStatusColor(order.status)} shadow-sm`}>
                    {order.status === 'completed' ? <CheckCircle size={24}/> : 
                     order.status === 'shipping' || order.status.startsWith('paid') ? <Truck size={24}/> : <Clock size={24}/>}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-black text-gray-800 text-lg">Đơn #{order.id.slice(0, 8).toUpperCase()}</p>
                      <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-1.5">
                      <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                        <Calendar size={14} className="text-gray-400"/> {formatDate(order.created_at)}
                      </p>
                      {role === 'admin' && (
                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                          <UserIcon size={14} className="text-gray-400"/> {order.user_email}
                        </p>
                      )}
                      <span className="text-xs text-gray-400 font-bold flex items-center gap-1.5">
                        {order.payment_method === 'online' ? (
                          <><CreditCard size={14} className="text-blue-400"/> Thẻ Online</>
                        ) : order.payment_method === 'vnpay' ? (
                          <><div className="w-4 h-4 bg-red-500 text-white flex items-center justify-center rounded-[2px] text-[6px] font-black italic">VN</div> VNPay</>
                        ) : order.payment_method === 'momo' ? (
                          <><div className="w-4 h-4 bg-pink-500 text-white flex items-center justify-center rounded-[2px] text-[6px] font-black italic">M</div> MoMo</>
                        ) : order.payment_method === 'direct' ? (
                          <><Wallet size={14} className="text-amber-400"/> Tiền mặt</>
                        ) : (
                          <><Wallet size={14} className="text-gray-400"/> Chưa rõ PT</>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 mt-4 md:mt-0">
                  <div className="flex items-center gap-4">
                    {/* Nút xác nhận chỉ hiện cho ADMIN và khi đơn đang chờ thanh toán tiền mặt */}
                    {role === 'admin' && order.status === 'pending' && order.payment_method === 'direct' && (
                      <button 
                        onClick={(e) => confirmCashPayment(e, order.id)}
                        disabled={processingId === order.id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition shadow-md active:scale-95 disabled:bg-gray-400"
                      >
                        {processingId === order.id ? <Loader2 className="animate-spin" size={14}/> : <CheckCircle size={14}/>}
                        Xác nhận đã thu tiền
                      </button>
                    )}
                    
                    <div className="text-right min-w-[120px]">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Tổng cộng</p>
                      <p className="font-black text-primary text-xl">{order.total_amount?.toLocaleString()} ₫</p>
                    </div>
                  </div>
                  {expandedOrder === order.id ? <ChevronUp className="text-gray-300"/> : <ChevronDown className="text-gray-300"/>}
                </div>
              </div>

              {/* Chi tiết Đơn hàng (Khi bấm vào mới hiện) */}
              {expandedOrder === order.id && (
                <div className="p-4 border-t bg-white animate-in slide-in-from-top-2">
                  <h4 className="font-bold text-sm text-gray-700 mb-3 uppercase tracking-wide">Chi tiết nguồn gốc (Tracking)</h4>
                  
                  <div className="space-y-4">
                    {/* Nhóm theo sản phẩm để hiển thị gọn hơn */}
                    {Object.values(
                      (order.batch_details || []).reduce((acc, item) => {
                        if (!acc[item.productId]) {
                          acc[item.productId] = {
                            productName: item.productName,
                            totalQty: 0,
                            batches: []
                          };
                        }
                        acc[item.productId].totalQty += Number(item.quantityTaken);
                        acc[item.productId].batches.push({
                          id: item.batchId,
                          qty: item.quantityTaken
                        });
                        return acc;
                      }, {})
                    ).map((group, pIdx) => (
                      <div key={pIdx} className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <p className="font-bold text-gray-800 text-base">{group.productName}</p>
                            <p className="text-sm text-gray-500">Tổng số lượng: <span className="font-bold text-indigo-600">{group.totalQty}</span> hộp</p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 md:justify-end">
                            {group.batches.map((batch, bIdx) => (
                              <div key={bIdx} className="flex items-center gap-2 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg shadow-sm">
                                <div className="text-right">
                                  <span className="block text-[9px] text-gray-400 uppercase leading-none">Lô hàng ({batch.qty} hộp)</span>
                                  <span className="font-mono font-bold text-indigo-600 text-xs">#{batch.id}</span>
                                </div>
                                <Link 
                                  to={`/tracking?id=${batch.id}`}
                                  className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-md transition"
                                  title="Xem nguồn gốc lô này"
                                >
                                  <ExternalLink size={14} />
                                </Link>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {(!order.batch_details || order.batch_details.length === 0) && (
                     <p className="text-sm text-gray-400 italic text-center py-4">Đơn hàng cũ, không có thông tin lô.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12 pb-10">
          <button
            onClick={() => paginate(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              currentPage === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-primary border border-gray-200 hover:border-primary shadow-sm'
            }`}
          >
            Trước
          </button>

          <div className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => paginate(i + 1)}
                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                  currentPage === i + 1
                    ? 'bg-primary text-white shadow-md shadow-blue-100'
                    : 'bg-white text-gray-600 border border-gray-100 hover:border-primary'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              currentPage === totalPages 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-primary border border-gray-200 hover:border-primary shadow-sm'
            }`}
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;