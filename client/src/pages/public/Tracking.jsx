import React, { useState, useContext, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Web3Context } from '../../context/Web3Context';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Search, Package, MapPin, Clock, User, CheckCircle2, Loader2, FileText, Image as LucideImage, ExternalLink } from 'lucide-react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../utils/constants';

const Tracking = () => {
  const { contract } = useContext(Web3Context);
  const [searchParams] = useSearchParams();
  
  const [searchId, setSearchId] = useState('');
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' hoặc 'docs'
  const [batchData, setBatchData] = useState(null);
  const [productDetails, setProductDetails] = useState(null); 
  const [timeline, setTimeline] = useState([]);
  const [docs, setDocs] = useState([]); // Danh sách URL giấy tờ
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchFullData = async (id) => {
    if (!id || id.trim() === "") return;
    
    setLoading(true);
    setError('');
    setBatchData(null);
    setProductDetails(null);
    setTimeline([]);
    setDocs([]);

    try {
      let activeContract = contract;

      // --- KHẮC PHỤC LỖI TRÊN DI ĐỘNG (Provider chưa sẵn sàng) ---
      if (!activeContract) {
        console.log("Di động: Thử khởi tạo Provider Read-only thủ công...");
        const rpcUrl = "https://ethereum-sepolia-rpc.publicnode.com";
        const readProvider = new ethers.JsonRpcProvider(rpcUrl);
        activeContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readProvider);
      }

      // Đảm bảo id là số nguyên (vì Batch ID trong Contract là uint256)
      const numericId = BigInt(id);
      console.log("--- BẮT ĐẦU TRA CỨU LÔ HÀNG ---");
      console.log("ID đang tra cứu:", numericId.toString());
      
      // 1. Lấy dữ liệu từ Blockchain
      const batch = await activeContract.getBatchDetails(numericId);
      
      // Xử lý dữ liệu trả về từ Contract (Hỗ trợ cả object và array)
      const b_name = batch.name || batch[0];
      const b_manuf = batch.manufacturer || batch[1];
      const b_owner = batch.currentOwner || batch[2];
      const b_creator = batch.creator || batch[3];
      const b_status = batch.status !== undefined ? Number(batch.status) : Number(batch[4]);

      // 2. Lấy Timeline
      let history = [];
      try {
        history = await activeContract.getBatchTimeline(numericId);
      } catch (e) { console.log("Lô này chưa có lịch sử"); }

      // 3. Lấy Giấy tờ
      let docUrls = [];
      try {
        docUrls = await activeContract.getBatchDocuments(numericId);
      } catch (e) { console.log("Lô này chưa có giấy tờ"); }

      // 4. Lấy dữ liệu từ Firebase (Ảnh mẫu sản phẩm) - TÁCH BIỆT ĐỂ KHÔNG LÀM LỖI CẢ TRANG
      try {
        const q = query(collection(db, "products"), where("name", "==", b_name));
        const fbSnap = await getDocs(q);
        
        if (!fbSnap.empty) {
          setProductDetails(fbSnap.docs[0].data());
        }
      } catch (fbError) {
        console.warn("Firebase bị chặn quyền (Chưa login), bỏ qua phần lấy ảnh sản phẩm.");
      }

      // Cập nhật State
      setBatchData({
        id: numericId.toString(),
        name: b_name,
        manufacturer: b_manuf,
        currentOwner: b_owner,
        creator: b_creator,
        status: b_status
      });
      setTimeline(history);
      setDocs(docUrls);

    } catch (err) {
      console.error("LỖI TRA CỨU:", err);
      
      let message = "Không tìm thấy thông tin cho lô thuốc #" + id + ".";
      
      // Phân loại lỗi để báo chính xác cho người dùng
      if (err.message.includes("network") || err.message.includes("fetch")) {
        message = "Lỗi kết nối mạng Blockchain. Vui lòng kiểm tra internet trên điện thoại.";
      } else if (err.message.includes("Chưa kết nối Smart Contract")) {
        message = err.message;
      } else {
        // Hiện lỗi thô để debug nếu không phải lỗi phổ biến
        message = `Lỗi tra cứu lô #${id}: ` + (err.reason || err.message || "Mã không tồn tại.");
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchId) fetchFullData(searchId);
  };

  // Helper: Format ngày tháng từ Timestamp Blockchain
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    // Blockchain lưu giây, JS dùng mili-giây nên phải nhân 1000
    try {
      return new Date(Number(timestamp) * 1000).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return "N/A";
    }
  };

  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    if (idFromUrl) {
      setSearchId(idFromUrl);
      fetchFullData(idFromUrl);
    }
  }, [searchParams]); // Chỉ chạy khi URL có ID, không đợi MetaMask nữa

  return (
    <div className="max-w-3xl mx-auto p-6">
      
      {/* 1. Thanh tìm kiếm */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary mb-2">Tra Cứu Nguồn Gốc</h1>
        <p className="text-gray-500 mb-6">Nhập mã lô thuốc (Batch ID) để kiểm tra hành trình</p>
        
        <form onSubmit={handleSearch} className="relative max-w-lg mx-auto">
          <input
            type="number"
            placeholder="Nhập ID lô thuốc (VD: 1)"
            className="w-full pl-12 pr-4 py-4 rounded-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-lg shadow-sm"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
          <button 
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 bottom-2 bg-primary text-white px-6 rounded-full font-medium hover:bg-blue-700 transition"
          >
            {loading ? "Đang tìm..." : "Tra cứu"}
          </button>
        </form>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>

      {/* 2. Kết quả hiển thị */}
      {batchData && (
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Cột trái: Thông tin thuốc (Kết hợp Firebase) */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <div className="flex justify-center mb-4">
                {productDetails?.imageUrl ? (
                  <img 
                    src={productDetails.imageUrl} 
                    alt={batchData.name}
                    className="w-32 h-32 object-cover rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-primary">
                    <Package size={40} />
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-800 text-center mb-1">{batchData.name}</h2>
              <p className="text-sm text-gray-500 text-center mb-6">{batchData.manufacturer}</p>
              
              {productDetails && (
                <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                   <p className="text-xs text-gray-400 uppercase font-bold mb-1">Giá niêm yết</p>
                   <p className="text-lg font-bold text-indigo-600">{productDetails.price?.toLocaleString()}đ</p>
                </div>
              )}

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <User size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-500 text-xs">SỞ HỮU HIỆN TẠI</p>
                    <p className="font-mono text-gray-700 break-all">
                      {batchData.currentOwner && batchData.currentOwner.toString().startsWith("0x0000000000000000000000000000000000000000") 
                        ? "Không có" 
                        : batchData.currentOwner}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-green-500" />
                  <div>
                    <p className="text-gray-500 text-xs">TRẠNG THÁI</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {batchData.status === 0 ? "Đã sản xuất" : batchData.status === 1 ? "Đã kiểm định" : batchData.status === 2 ? "Đang vận chuyển" : "Đã giao hàng"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Timeline & Giấy tờ (Tab) */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              
              {/* Tab Header */}
              <div className="flex border-b">
                <button 
                  onClick={() => setActiveTab('timeline')}
                  className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'timeline' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <Clock size={18} /> HÀNH TRÌNH SẢN PHẨM
                </button>
                <button 
                  onClick={() => setActiveTab('docs')}
                  className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'docs' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <FileText size={18} /> XEM GIẤY TỜ THUỐC
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'timeline' ? (
                  /* --- PHẦN HÀNH TRÌNH --- */
                  <div className="space-y-8 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-gray-100">
                    {timeline.length > 0 ? (
                      timeline.map((event, index) => (
                        <div key={index} className="relative pl-12">
                          <div className={`absolute left-0 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shadow-sm z-10 ${index === 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                            {index === 0 ? <Package size={18}/> : <MapPin size={18}/>}
                          </div>
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-blue-200 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                              <h3 className="font-bold text-gray-800 uppercase tracking-tight">
                                {event.description}
                              </h3>
                              <span className="text-xs font-medium text-gray-400 bg-white px-2 py-1 rounded-md shadow-sm">
                                {formatDate(event.timestamp)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/50 p-2 rounded-lg">
                              <User size={14} className="text-gray-400" />
                              <span className="font-mono truncate">Thực hiện bởi: {event.actor}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-gray-400">Chưa có lịch sử hành trình</div>
                    )}
                  </div>
                ) : (
                  /* --- PHẦN GIẤY TỜ --- */
                  <div className="space-y-6">
                    {docs.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {docs.map((url, index) => (
                          <div key={index} className="group relative bg-gray-50 rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                            <img 
                              src={url} 
                              alt={`Giấy tờ ${index + 1}`} 
                              className="w-full h-48 object-cover cursor-pointer"
                              onClick={() => window.open(url, '_blank')}
                            />
                            <div className="p-3 flex justify-between items-center bg-white">
                              <span className="text-xs font-bold text-gray-500 uppercase">Tài liệu pháp lý #{index + 1}</span>
                              <a href={url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800">
                                <ExternalLink size={16} />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <LucideImage size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">Lô thuốc này chưa được Admin cập nhật giấy tờ pháp lý.</p>
                        <p className="text-xs text-gray-400 mt-1">Vui lòng kiểm tra lại sau hoặc liên hệ nhà sản xuất.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Tracking;