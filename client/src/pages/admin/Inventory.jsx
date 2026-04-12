import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../../context/Web3Context';
import { useAuth } from '../../context/AuthContext';
import { Package, Truck, Loader2, QrCode, X, Printer, CheckCircle2, FileText, Upload, Image as LucideImage, ExternalLink, Trash2, Download, Search, RefreshCw } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { QRCodeSVG } from 'qrcode.react';

const Inventory = () => {
  const { contract, currentAccount } = useContext(Web3Context);
  const { user } = useAuth();
  
  const [myBatches, setMyBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [qrBatch, setQrBatch] = useState(null);
  
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [deliveryBatch, setDeliveryBatch] = useState(null); // Modal kết thúc
  const [docsBatch, setDocsBatch] = useState(null); // Modal cập nhật giấy tờ
  const [existingDocUrls, setExistingDocUrls] = useState([]); // Giấy tờ đã có trên BC
  const [docLinks, setDocLinks] = useState([]); // Link ảnh nhập tay
  const [linkInput, setLinkInput] = useState(''); // Ô nhập link
  const [isUploading, setIsUploading] = useState(false);
  const [transferData, setTransferData] = useState({ toAddress: '', note: '' });
  const [deliveryNote, setDeliveryNote] = useState(''); // Ghi chú kết thúc
  const [transfering, setTransfering] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [deleting, setDeleting] = useState(false); // Thêm state cho xóa lô hàng
  const [isUploadingDocs, setIsUploadingDocs] = useState(false); // State cho nút upload file
  const [nameFilter, setNameFilter] = useState('');
  // Phân trang: 6 lô hàng mỗi trang
  const [page, setPage] = useState(1);
  const perPage = 6;

  const filteredBatches = myBatches.filter(b => 
    !nameFilter || 
    b.name.toLowerCase().includes(nameFilter.trim().toLowerCase()) ||
    b.id.toString().includes(nameFilter.trim())
  );
  const totalPages = Math.max(1, Math.ceil(filteredBatches.length / perPage));
  const start = (page - 1) * perPage;
  const visibleBatches = filteredBatches.slice(start, start + perPage);

  useEffect(() => {
    setPage(1);
  }, [nameFilter, myBatches]);

  const handleDocFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Kiểm tra định dạng và dung lượng cho từng file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        alert(`❌ File "${file.name}" không đúng định dạng (Chỉ JPG, PNG, WEBP, PDF).`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`❌ File "${file.name}" quá lớn (>5MB).`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploadingDocs(true);
    try {
      const uploadPromises = validFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `documents/${fileName}`;

        const { error } = await supabase.storage
          .from('meditrack')
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('meditrack')
          .getPublicUrl(filePath);
        
        return publicUrl;
      });

      const publicUrls = await Promise.all(uploadPromises);

      setDocLinks(prev => [...prev, ...publicUrls]);
      alert(`✅ Đã tải ${publicUrls.length} tài liệu lên thành công!`);
    } catch (error) {
      console.error("Lỗi upload:", error);
      alert("Lỗi upload: " + (error.message || "Không rõ lỗi"));
    } finally {
      setIsUploadingDocs(false);
      event.target.value = '';
    }
  };
  
  const downloadQRCode = () => {
      const svg = document.querySelector("#batch-qr-code");
      if (!svg) return alert("Không tìm thấy mã QR");

      // Bước 1: Chuyển SVG thành chuỗi mã hóa
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      // Tạo một ảnh tạm để vẽ
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        // Thiết lập kích thước ảnh tải về (Rất nét)
        canvas.width = 1200;
        canvas.height = 1400;
        
        // Vẽ nền trắng hoàn toàn
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Vẽ mã QR (Căn giữa)
        ctx.drawImage(img, 200, 150, 800, 800);
        
        // Viết chữ tiêu đề
        ctx.fillStyle = "#000000";
        ctx.font = "bold 50px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`MÃ TRUY XUẤT NGUỐC GỐC`, canvas.width / 2, 1050);
        
        // Viết mã lô
        ctx.font = "bold 40px Arial";
        ctx.fillStyle = "#2563eb"; // Màu xanh primary
        ctx.fillText(`Lô hàng: #${qrBatch.id}`, canvas.width / 2, 1130);
        
        // Viết tên thuốc
        ctx.font = "30px Arial";
        ctx.fillStyle = "#666666";
        ctx.fillText(qrBatch.name, canvas.width / 2, 1200);

        // Tạo link tải về dưới dạng PNG
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `QR_LOHANG_${qrBatch.id}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Giải phóng bộ nhớ
        URL.revokeObjectURL(url);
      };

      img.src = url;
    };

  const fetchMyInventory = async () => {
    if (!contract || !currentAccount) return;
    setLoading(true);

    try {
      // 1. Lấy thông tin cơ bản
      const adminAddress = await contract.admin();
      const totalBatches = await contract.batchCount();
      const userAddr = currentAccount.toLowerCase();
      const contractAdmin = adminAddress.toLowerCase();
      const isAdmin = (user?.role === 'admin') || (userAddr === contractAdmin);

      // Hàm helper để fetch thông tin của 1 lô hàng duy nhất
      const fetchSingleBatch = async (index) => {
        try {
          const bCode = await contract.allBatchCodes(index);
          if (bCode.toString() === "0") return null;

          const batchInfo = await contract.batches(bCode);
          if (!batchInfo.isExists) return null;

          const batch = await contract.getBatchDetails(bCode);
          
          const b_name = batch.name || batch[0];
          const b_manuf = batch.manufacturer || batch[1];
          const b_owner = (batch.currentOwner || batch[2] || "").toString().toLowerCase();
          const b_creator = (batch.creator || batch[3] || "").toString().toLowerCase();
          const b_status = batch.status !== undefined ? Number(batch.status) : Number(batch[4]);

          const isOwnerOnChain = b_owner === userAddr || b_creator === userAddr || isAdmin;

          if (isAdmin || b_owner === userAddr || b_creator === userAddr) {
            return {
              id: bCode.toString(),
              name: b_name,
              manufacturer: b_manuf,
              status: b_status,
              isOwnerOnChain: isOwnerOnChain
            };
          }
          return null;
        } catch (e) {
          console.warn(`Lô tại index #${index} lỗi:`, e.message);
          return null;
        }
      };

      const batchCount = Number(totalBatches);
      const tempBatches = [];
      const CHUNK_SIZE = 25; // Tăng lên 25 để load cực nhanh

      // 2. Chạy song song tất cả các request cùng lúc thay vì chia chunk chậm chạp
      const allPromises = [];
      for (let i = 0; i < batchCount; i++) {
        allPromises.push(fetchSingleBatch(i));
      }

      // Thực thi song song tất cả các request
      const allResults = await Promise.all(allPromises);
      
      // Lọc bỏ những kết quả null và thêm vào danh sách chính
      const validBatches = allResults.filter(batch => batch !== null);
      tempBatches.push(...validBatches);

      setMyBatches(tempBatches);

    } catch (err) {
      console.error("Lỗi tải kho hàng:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!contract || !selectedBatch) return;

    if (!currentAccount) {
      return alert("⚠️ Vui lòng kết nối ví MetaMask để thực hiện giao dịch này!");
    }

    // KIỂM TRA CONTRACT CÓ QUYỀN GHI (SIGNER) CHƯA
    if (!contract || !contract.runner || typeof contract.runner.sendTransaction !== 'function') {
      return alert("⚠️ Lỗi: Contract đang ở chế độ Read-only. Vui lòng kết nối lại ví hoặc tải lại trang.");
    }

    try {
      setTransfering(true);
      
      const tx = await contract.transferBatch(
        selectedBatch.id, 
        transferData.toAddress, 
        transferData.note
      );
      await tx.wait(); // Chờ xác nhận thành công trên Blockchain

      alert("✅ Chuyển hàng thành công!");
      setSelectedBatch(null); 
      setTransferData({ toAddress: '', note: '' });
      fetchMyInventory(); // Load lại danh sách hiển thị
      
    } catch (error) {
      console.error(error);
      alert("❌ Lỗi: " + (error.reason || error.message));
    } finally {
      setTransfering(false);
    }
  };

  const handleDeliver = async (e) => {
    e.preventDefault();
    if (!contract || !deliveryBatch) return;

    if (!currentAccount) {
      return alert("⚠️ Vui lòng kết nối ví MetaMask để thực hiện giao dịch này!");
    }

    // KIỂM TRA CONTRACT CÓ QUYỀN GHI (SIGNER) CHƯA
    if (!contract || !contract.runner || typeof contract.runner.sendTransaction !== 'function') {
      return alert("⚠️ Lỗi: Contract đang ở chế độ Read-only. Vui lòng kết nối lại ví hoặc tải lại trang.");
    }

    try {
      setDelivering(true);
      
      const batchInfo = await contract.getBatchDetails(deliveryBatch.id);
      const adminAddr = await contract.admin();
      const tx = await contract.deliverBatch(deliveryBatch.id, deliveryNote);
      await tx.wait();

      alert("✅ Đã xác nhận vận chuyển thành công!");
      setDeliveryBatch(null);
      setDeliveryNote('');
      fetchMyInventory();
    } catch (error) {
      console.error("LỖI CHI TIẾT:", error);
      alert("❌ Lỗi: " + (error.reason || error.message || "Giao dịch bị từ chối"));
    } finally {
      setDelivering(false);
    }
  };

  const handleDeleteBatch = async (batch) => {
    if (!contract) return;
    const batchId = batch.id;
    
    if (!currentAccount) {
      return alert("⚠️ Vui lòng kết nối ví MetaMask để thực hiện giao dịch này!");
    }

    // KIỂM TRA CONTRACT CÓ QUYỀN GHI (SIGNER) CHƯA
    if (!contract || !contract.runner || typeof contract.runner.sendTransaction !== 'function') {
      return alert("⚠️ Lỗi: Contract đang ở chế độ Read-only. Vui lòng kết nối lại ví hoặc tải lại trang.");
    }

    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn XÓA lô hàng #${batchId}? Hành động này sẽ vô hiệu hóa lô hàng trên Blockchain và TRỪ số lượng tồn kho trong hệ thống. Thao tác này không thể hoàn tác.`);
    if (!confirmDelete) return;

    try {
      setDeleting(true);
      
      // 1. GỬI GIAO DỊCH BLOCKCHAIN
      const tx = await contract.deleteBatch(batchId);
      console.log("Đang chờ xác nhận xóa trên Blockchain... Hash:", tx.hash);
      await tx.wait();

      // 2. CẬP NHẬT SUPABASE (GIẢM TỒN KHO)
      console.log("Đang cập nhật tồn kho trong Supabase...");
      try {
        // Tìm sản phẩm trong Supabase dựa trên tên sản phẩm của lô hàng
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .eq('name', batch.name)
          .single();
        
        if (!fetchError && product) {
          // Tìm thông tin lô hàng này trong mảng batches của sản phẩm
          const currentBatches = product.batches || [];
          const batchInfo = currentBatches.find(b => b.id === batchId);
          const qtyToRemove = batchInfo ? Number(batchInfo.qty) : 0;

          if (qtyToRemove > 0) {
            // Cập nhật: Lọc bỏ lô hàng đã xóa và giảm total_stock
            const updatedBatches = currentBatches.filter(b => b.id !== batchId);
            const updatedStock = (Number(product.total_stock) || 0) - qtyToRemove;

            const { error: updateError } = await supabase
              .from('products')
              .update({
                batches: updatedBatches,
                total_stock: updatedStock
              })
              .eq('id', product.id);
            
            if (updateError) throw updateError;
            console.log(`Đã trừ ${qtyToRemove} sản phẩm khỏi kho.`);
          }
        }
      } catch (sbError) {
        console.error("Lỗi cập nhật Supabase sau khi xóa Blockchain:", sbError);
      }

      alert(`✅ Đã xóa lô hàng #${batchId} thành công!`);
      fetchMyInventory();
    } catch (error) {
      console.error("Lỗi xóa lô hàng:", error);
      const errorMsg = error.reason || error.message || "Giao dịch bị từ chối";
      alert("❌ XÓA THẤT BẠI: \n" + errorMsg);
    } finally {
      setDeleting(false);
    }
  };

  const openDocsModal = async (batch) => {
    setDocsBatch(batch);
    setExistingDocUrls([]);
    if (!contract) return;
    try {
      const urls = await contract.getBatchDocuments(BigInt(batch.id));
      setExistingDocUrls(urls || []);
    } catch (e) {
      console.log("Không lấy được giấy tờ cũ:", e);
    }
  };

  const handleUpdateDocs = async (e) => {
    e.preventDefault();
    if (!contract || !docsBatch || docLinks.length === 0) {
      return alert("Vui lòng nhập ít nhất một link ảnh!");
    }

    try {
      setIsUploading(true);
      
      // KIỂM TRA CONTRACT CÓ QUYỀN GHI (SIGNER) CHƯA
      if (!contract || !contract.runner || typeof contract.runner.sendTransaction !== 'function') {
        throw new Error("Contract đang ở chế độ Read-only. Vui lòng kết nối lại ví.");
      }

      // signerAddr lấy trực tiếp từ currentAccount (Web3Context)
      const signerAddr = currentAccount;
      if (!signerAddr) {
        throw new Error("Vui lòng kết nối ví MetaMask!");
      }

      const batchId = BigInt(docsBatch.id);
      
      const batchInfo = await contract.getBatchDetails(batchId);
      const contractAdmin = await contract.admin();
      
      let existingDocs = [];
      try {
        existingDocs = await contract.getBatchDocuments(batchId);
      } catch (e) {
        console.log("Lô này chưa có giấy tờ cũ.");
      }
      
      const isOwner = batchInfo.currentOwner.toLowerCase() === signerAddr.toLowerCase();
      const isCreator = batchInfo.creator.toLowerCase() === signerAddr.toLowerCase();
      const isContractAdmin = contractAdmin.toLowerCase() === signerAddr.toLowerCase();

      if (!isOwner && !isCreator && !isContractAdmin) {
        throw new Error(`Bạn không có quyền sửa lô này.`);
      }

      // Gộp và chuẩn hóa (Trim spaces) các link nhập tay
      const cleanDocLinks = docLinks.map(link => link.trim()).filter(link => link.length > 0);
      
      // GỘP CẢ CÁI CŨ + LINK MỚI
      const allUrls = [...existingDocs, ...cleanDocLinks];

      if (allUrls.length === 0) {
        throw new Error("Không có dữ liệu hợp lệ để cập nhật.");
      }

      const tx = await contract.updateBatchDocuments(batchId, allUrls, {
        gasLimit: 1000000 
      });
      
      await tx.wait();

      alert("✅ Thành công! Giấy tờ đã được lưu lên Blockchain.");
      setDocsBatch(null);
      setDocLinks([]);
      setLinkInput('');
      fetchMyInventory();
    } catch (error) {
      console.error("LỖI CHI TIẾT:", error);
      const errorMsg = error.reason || error.message || "Giao dịch bị từ chối";
      alert("❌ KHÔNG THÀNH CÔNG: \n" + errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    fetchMyInventory();
  }, [contract, currentAccount]);

  return (
    <div className="max-w-6xl mx-auto p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Package className="text-primary" size={32} />
            Kho Hàng Của Tôi
          </h1>
        </div>
        <div className="flex-1 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Lọc theo tên hoặc ID lô..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm font-medium text-sm"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 whitespace-nowrap">
            <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
              Hiển thị: <span className="text-primary">{visibleBatches.length}</span> / {filteredBatches.length} lô
            </div>
            <button 
              onClick={fetchMyInventory} 
              className="p-3 bg-white hover:bg-gray-50 text-primary rounded-xl transition-all border border-gray-100 shadow-sm"
              title="Làm mới danh sách"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10"><Loader2 className="animate-spin mx-auto"/> Đang tải dữ liệu Blockchain...</div>
      ) : !currentAccount ? (
        <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
          <Truck className="mx-auto text-gray-300 mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-700 mb-2">Chưa kết nối ví MetaMask</h2>
          <p className="text-gray-500 mb-6">Vui lòng kết nối ví để xem và quản lý kho hàng của bạn.</p>
        </div>
      ) : myBatches.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500">Kho hàng trống. Bạn chưa sở hữu lô thuốc nào.</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleBatches.map((batch) => (
              <div key={batch.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-50 text-primary font-bold px-3 py-1 rounded-md text-sm">
                    ID: #{batch.id}
                  </div>
                  {batch.status === 3 ? (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                      <CheckCircle2 size={12}/> Vận chuyển thành công
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                      Đang giữ hàng
                    </span>
                  )}
                </div>
                
                <div className="flex-grow flex flex-col">
                  <div className="min-h-[4.5rem]">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 leading-tight">
                      {batch.name}
                    </h3>
                  </div>
                  
                  <div className="mt-auto pt-3 border-t border-gray-50 mb-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nơi sản xuất</span>
                      <p className="text-base text-primary font-bold">{batch.manufacturer}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setQrBatch(batch)}
                      className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 transition text-sm"
                    >
                      <QrCode size={18} /> Mã QR
                    </button>

                    <button 
                      onClick={() => setSelectedBatch(batch)}
                      className="flex-1 py-2.5 bg-white border border-primary text-primary font-medium rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      disabled={batch.status === 3}
                    >
                      <Truck size={18} /> Chuyển đi
                    </button>
                  </div>

                  {batch.status !== 3 && (
                    <>
                      <button 
                        onClick={() => openDocsModal(batch)}
                        disabled={!batch.isOwnerOnChain}
                        className={`w-full py-2.5 font-medium rounded-lg flex items-center justify-center gap-2 transition border text-sm ${
                          batch.isOwnerOnChain 
                          ? 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100' 
                          : 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                        }`}
                      >
                        <FileText size={18} /> 
                        {batch.isOwnerOnChain ? "Cập nhật giấy tờ" : "Không có quyền sửa"}
                      </button>
                      <button 
                        onClick={() => setDeliveryBatch(batch)}
                        className="w-full py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition text-sm"
                      >
                        <CheckCircle2 size={18} /> Kết thúc lộ trình
                      </button>
                    </>
                  )}
                  
                  {/* Nút Xóa lô hàng - Hiển thị cho cả status 3 */}
                  <button 
                    onClick={() => handleDeleteBatch(batch)}
                    disabled={deleting || !batch.isOwnerOnChain}
                    className="w-full py-2.5 bg-red-50 text-red-600 border border-red-100 font-medium rounded-lg hover:bg-red-100 flex items-center justify-center gap-2 transition text-sm disabled:opacity-50"
                  >
                    {deleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                    Xóa lô hàng
                  </button>
                  
                  {batch.status === 3 && (
                    <div className="mt-2 flex items-center justify-center border border-dashed border-gray-200 rounded-lg bg-gray-50 text-gray-400 text-[10px] text-center px-4 py-2">
                      Lô hàng này đã hoàn tất hành trình.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="mt-8 flex justify-center items-center gap-4">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition shadow-sm"
            >
              Trước
            </button>
            <span className="text-sm font-bold text-gray-600">Trang {page} / {totalPages}</span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition shadow-sm"
            >
              Sau
            </button>
          </div>
        </>
      )}

      {/* MODAL CHUYỂN HÀNG */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-4">Chuyển lô #{selectedBatch.id}</h2>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ người nhận</label>
                <input 
                  required
                  placeholder="0x..."
                  className="w-full p-3 border rounded-lg font-mono text-sm"
                  value={transferData.toAddress}
                  onChange={e => setTransferData({...transferData, toAddress: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea 
                  required
                  placeholder="VD: Đã xuất kho..."
                  className="w-full p-3 border rounded-lg"
                  rows="3"
                  value={transferData.note}
                  onChange={e => setTransferData({...transferData, note: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setSelectedBatch(null)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={transfering}
                  className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 flex justify-center items-center gap-2"
                >
                  {transfering ? <Loader2 className="animate-spin" size={18}/> : "Xác nhận"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KẾT THÚC LỘ TRÌNH */}
      {deliveryBatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-4">Kết thúc lộ trình lô #{deliveryBatch.id}</h2>
            <form onSubmit={handleDeliver} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú kết thúc</label>
                <textarea 
                  required
                  placeholder="VD: Đã giao hàng đến bệnh viện X..."
                  className="w-full p-3 border rounded-lg"
                  rows="3"
                  value={deliveryNote}
                  onChange={e => setDeliveryNote(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setDeliveryBatch(null)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={delivering}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex justify-center items-center gap-2"
                >
                  {delivering ? <Loader2 className="animate-spin" size={18}/> : "Xác nhận kết thúc"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CẬP NHẬT GIẤY TỜ */}
      {docsBatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Giấy tờ lô #{docsBatch.id}</h2>
              <button onClick={() => setDocsBatch(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateDocs} className="space-y-4">
              {/* Danh sách giấy tờ ĐÃ CÓ trên Blockchain */}
              {existingDocUrls.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-400 uppercase mb-2 tracking-wider">Giấy tờ hiện có trên Blockchain</p>
                  <div className="space-y-1">
                    {existingDocUrls.map((url, i) => (
                      <div key={`existing-${i}`} className="text-xs text-blue-600 flex items-center justify-between gap-2 p-1 bg-white/50 rounded">
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle2 size={12} className="text-blue-400" />
                          <span className="truncate italic">Tài liệu #{i + 1} (Đã lưu)</span>
                        </div>
                        <a href={url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-600">
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-blue-400 mt-2">* Các tài liệu này sẽ được giữ lại khi bạn cập nhật thêm cái mới.</p>
                </div>
              )}

              {/* Phần 1: Tải ảnh từ máy tính (Kéo thả) */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">Tải ảnh từ máy tính</label>
                <div 
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition cursor-pointer hover:bg-blue-50/50 ${
                    isUploadingDocs ? 'border-gray-300 bg-gray-50' : 'border-indigo-200'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                      handleDocFileUpload({ target: { files } });
                    }
                  }}
                  onClick={() => document.getElementById('doc-upload-input').click()}
                >
                  <input 
                    id="doc-upload-input"
                    type="file" 
                    className="hidden" 
                    accept="image/*,application/pdf" 
                    multiple 
                    onChange={handleDocFileUpload} 
                  />
                  {isUploadingDocs ? (
                    <Loader2 size={32} className="animate-spin text-indigo-500 mb-2" />
                  ) : (
                    <Upload size={32} className="text-indigo-500 mb-2" />
                  )}
                  <span className="text-sm text-gray-600 font-medium">
                    {isUploadingDocs ? "Đang tải lên..." : "Chọn hoặc kéo thả ảnh"}
                  </span>
                </div>
              </div>

              {/* Phần 2: Nhập link ảnh trực tiếp */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">Hoặc nhập link ảnh trực tiếp</label>
                <div className="flex gap-2">
                  <input 
                    type="url"
                    placeholder="https://..."
                    className="flex-1 p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      if (linkInput.trim()) {
                        setDocLinks([...docLinks, linkInput.trim()]);
                        setLinkInput('');
                      }
                    }}
                    className="px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition shadow-md"
                  >
                    Thêm
                  </button>
                </div>
              </div>

              {/* Danh sách các link đã chọn */}
              {docLinks.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 shadow-inner">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-wider">DANH SÁCH GIẤY TỜ CHUẨN BỊ LƯU</p>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {docLinks.map((link, i) => (
                      <div key={`link-${i}`} className="text-xs text-gray-600 flex items-center justify-between gap-2 p-2 bg-white rounded-lg shadow-sm border border-gray-50 group hover:border-indigo-100 transition">
                        <div className="flex items-center gap-2 truncate">
                          <FileText size={14} className="text-indigo-400" />
                          <a href={link} target="_blank" rel="noreferrer" className="truncate text-blue-600 underline hover:text-blue-700 font-medium">
                            {link.split('/').pop().substring(0, 30)}...
                          </a>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setDocLinks(docLinks.filter((_, idx) => idx !== i))}
                          className="p-1 hover:bg-red-50 rounded-md transition text-red-400 opacity-0 group-hover:opacity-100"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setDocsBatch(null);
                    setDocLinks([]);
                    setLinkInput('');
                  }}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={isUploading || docLinks.length === 0}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-indigo-100"
                >
                  {isUploading ? <Loader2 className="animate-spin" size={20}/> : "Xác nhận lưu lên Blockchain"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QR CODE (ĐÃ SỬA) */}
      {qrBatch && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 animate-in zoom-in duration-200 flex flex-col items-center relative">
            <button 
              onClick={() => setQrBatch(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            <h3 className="text-xl font-bold text-gray-800 mb-1">Mã Tem Truy Xuất</h3>
            <p className="text-sm text-gray-500 mb-6 font-mono">Lô hàng #{qrBatch.id}</p>
            
            <div className="p-4 border-2 border-gray-900 rounded-xl bg-white">
              {/* 👇 THAY ĐỔI 2: Dùng QRCodeSVG thay vì QRCode */}
              <QRCodeSVG 
                id="batch-qr-code"
                value={`${window.location.origin}/tracking?id=${qrBatch.id}`} 
                size={200}
                level="H"
              />
            </div>

            <p className="text-center text-xs text-gray-400 mt-4 max-w-[200px]">
              Quét mã này để xem nguồn gốc và hành trình sản phẩm trên Blockchain.
            </p>

            <div className="flex gap-3 w-full mt-6">
              <button 
                onClick={downloadQRCode}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition"
              >
                <Download size={18}/> Tải xuống
              </button>
              <button 
                onClick={() => window.print()}
                className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition"
              >
                <Printer size={18}/> In Tem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
