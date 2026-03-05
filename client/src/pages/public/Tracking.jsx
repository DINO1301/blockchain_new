import React, { useState, useContext, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Web3Context } from '../../context/Web3Context';
import { supabase } from '../../services/supabase';
import { Search, Package, MapPin, Clock, User, CheckCircle2, Loader2, FileText, Image as LucideImage, ExternalLink, QrCode } from 'lucide-react';
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
        // Sepolia Chain ID: 11155111 - staticNetwork: true
        const readProvider = new ethers.JsonRpcProvider(rpcUrl, 11155111, { staticNetwork: true });
        activeContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readProvider);
      }

      // Đảm bảo id là số nguyên (vì Batch ID trong Contract là uint256)
      const numericId = BigInt(id);
      console.log("--- BẮT ĐẦU TRA CỨU LÔ HÀNG ---");
      console.log("ID đang tra cứu:", numericId.toString());
      
      // 1. Lấy dữ liệu từ Blockchain
      console.log("Đang gọi contract.getBatchDetails...");
      const batch = await activeContract.getBatchDetails(numericId);
      console.log("Kết quả từ Contract:", batch);
      
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

      // 4. Lấy dữ liệu từ Supabase (Ảnh mẫu sản phẩm)
      try {
        const { data, error: sbError } = await supabase
          .from('products')
          .select('*')
          .eq('name', b_name)
          .single();
        
        if (!sbError && data) {
          setProductDetails(data);
        }
      } catch (sbErr) {
        console.warn("Lỗi lấy thông tin sản phẩm từ Supabase:", sbErr);
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
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      
      {/* 1. Thanh tìm kiếm */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10 mb-6 sm:mb-10 text-center">
        <h1 className="text-2xl sm:text-4xl font-black text-primary mb-3 tracking-tight">Tra Cứu Nguồn Gốc</h1>
        <p className="text-gray-500 text-sm sm:text-lg mb-8 max-w-md mx-auto">Nhập mã lô thuốc (Batch ID) để kiểm tra hành trình minh bạch trên Blockchain</p>
        
        <form onSubmit={handleSearch} className="relative max-w-lg mx-auto">
          <input
            type="number"
            placeholder="Nhập ID lô thuốc (VD: 10126)"
            className="w-full pl-12 pr-4 py-4 sm:py-5 rounded-2xl border-2 border-gray-100 focus:border-primary outline-none text-base sm:text-xl shadow-sm transition-all placeholder:text-gray-300"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
          <button 
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 bottom-2 bg-primary text-white px-5 sm:px-8 rounded-xl font-bold hover:bg-blue-700 transition active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20}/> : "Tra cứu"}
          </button>
        </form>
        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}
      </div>

      {/* 2. Kết quả hiển thị */}
      {batchData && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          
          {/* Cột trái: Thông tin thuốc (Kết hợp Supabase) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:sticky lg:top-24">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-6">
                  {productDetails?.image_url ? (
                    <img 
                      src={productDetails.image_url} 
                      alt={batchData.name}
                      className="w-32 h-32 sm:w-40 sm:h-40 object-contain bg-gray-50 rounded-3xl p-4 shadow-inner"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-blue-50 rounded-3xl flex items-center justify-center text-primary">
                      <Package size={48} />
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-full border-4 border-white">
                    <CheckCircle2 size={16} />
                  </div>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-800 leading-tight mb-2">{batchData.name}</h2>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">{batchData.manufacturer}</p>
              </div>
              
              <div className="space-y-4 pt-6 border-t border-gray-50">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase font-black mb-1 tracking-wider">Sở hữu hiện tại</p>
                  <p className="font-mono text-[11px] text-gray-600 break-all leading-relaxed">
                    {batchData.currentOwner && batchData.currentOwner.toString().startsWith("0x0000000000000000000000000000000000000000") 
                      ? "Chưa xác định" 
                      : batchData.currentOwner}
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100">
                  <div>
                    <p className="text-[10px] text-green-600 uppercase font-black mb-1 tracking-wider">Trạng thái lô</p>
                    <span className="text-sm font-bold text-green-700">
                      {batchData.status === 0 ? "Đã sản xuất" : batchData.status === 1 ? "Đã kiểm định" : batchData.status === 2 ? "Đang vận chuyển" : "Đã giao hàng"}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-xl text-green-500 shadow-sm">
                    <CheckCircle2 size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Timeline & Giấy tờ (Tab) */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
              
              {/* Tab Header */}
              <div className="flex p-2 bg-gray-50/50 gap-2">
                <button 
                  onClick={() => setActiveTab('timeline')}
                  className={`flex-1 py-4 rounded-xl text-xs sm:text-sm font-black flex flex-col sm:flex-row items-center justify-center gap-2 transition-all ${activeTab === 'timeline' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Clock size={18} /> <span className="uppercase">Hành trình</span>
                </button>
                <button 
                  onClick={() => setActiveTab('docs')}
                  className={`flex-1 py-4 rounded-xl text-xs sm:text-sm font-black flex flex-col sm:flex-row items-center justify-center gap-2 transition-all ${activeTab === 'docs' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <FileText size={18} /> <span className="uppercase">Giấy tờ pháp lý</span>
                </button>
              </div>

              <div className="p-4 sm:p-8">
                {activeTab === 'timeline' ? (
                  /* --- PHẦN HÀNH TRÌNH --- */
                  <div className="space-y-10 relative before:absolute before:inset-0 before:left-4 sm:before:left-6 before:w-0.5 before:bg-gradient-to-b before:from-blue-100 before:to-transparent">
                    {timeline.length > 0 ? (
                      [...timeline].reverse().map((event, index) => (
                        <div key={index} className="relative pl-10 sm:pl-14 group">
                          <div className={`absolute left-0 sm:left-2 w-8 h-8 sm:w-10 sm:h-10 rounded-2xl border-4 border-white flex items-center justify-center shadow-md z-10 transition-transform group-hover:scale-110 ${index === 0 ? 'bg-primary text-white ring-4 ring-blue-50' : 'bg-white text-gray-300 border-gray-100'}`}>
                            {index === 0 ? <Package size={16}/> : <MapPin size={16}/>}
                          </div>
                          <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-blue-100 hover:shadow-lg hover:shadow-blue-50/50 transition-all duration-300">
                            <div className="flex flex-col mb-4">
                              <h3 className="font-black text-gray-800 text-sm sm:text-base leading-tight mb-2">
                                {event.description}
                              </h3>
                              <div className="flex items-center gap-2 text-gray-400">
                                <Clock size={12} />
                                <span className="text-[11px] font-bold uppercase tracking-wider">
                                  {formatDate(event.timestamp)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 bg-gray-50/80 p-3 rounded-xl border border-gray-50">
                              <User size={14} className="text-gray-400 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-black text-gray-300 uppercase mb-0.5 tracking-tight">Xác thực bởi địa chỉ</p>
                                <p className="font-mono text-[10px] text-gray-500 break-all leading-relaxed">
                                  {event.actor}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-20">
                         <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-200">
                            <Clock size={40} />
                         </div>
                         <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Chưa có lịch sử hành trình</p>
                      </div>
                    )}
                  </div>
                ) : activeTab === 'docs' ? (
                  /* --- PHẦN GIẤY TỜ --- */
                  <div className="space-y-6 animate-in fade-in duration-500">
                    {docs.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {docs.map((url, index) => (
                          <div key={index} className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500">
                            <div className="relative overflow-hidden aspect-[4/3]">
                              <img 
                                src={url} 
                                alt={`Giấy tờ ${index + 1}`} 
                                className="w-full h-full object-cover cursor-pointer transition-transform duration-700 group-hover:scale-110"
                                onClick={() => window.open(url, '_blank')}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="p-4 flex justify-between items-center">
                              <div>
                                <p className="text-[10px] font-black text-indigo-400 uppercase mb-0.5 tracking-widest">Tài liệu pháp lý</p>
                                <span className="text-sm font-black text-gray-800">Ảnh hồ sơ #{index + 1}</span>
                              </div>
                              <a 
                                href={url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors"
                              >
                                <ExternalLink size={18} />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 bg-gray-50 rounded-[40px] border-4 border-dashed border-gray-100">
                        <LucideImage size={64} className="mx-auto text-gray-200 mb-6" />
                        <p className="text-gray-500 font-medium">Lô thuốc này chưa được Admin cập nhật giấy tờ pháp lý.</p>
                        <p className="text-xs text-gray-400 mt-1">Vui lòng kiểm tra lại sau hoặc liên hệ nhà sản xuất.</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Tracking;