import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../../context/Web3Context';
import { Package, Truck, Loader2, QrCode, X, Printer, CheckCircle2, FileText, Upload, Image as LucideImage, ExternalLink } from 'lucide-react';
import { db, storage } from '../../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';

const Inventory = () => {
  const { contract, currentAccount } = useContext(Web3Context);
  
  const [myBatches, setMyBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [qrBatch, setQrBatch] = useState(null);
  
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [deliveryBatch, setDeliveryBatch] = useState(null); // Modal kết thúc
  const [docsBatch, setDocsBatch] = useState(null); // Modal cập nhật giấy tờ
  const [existingDocUrls, setExistingDocUrls] = useState([]); // Giấy tờ đã có trên BC
  const [docFiles, setDocsFiles] = useState([]); // File ảnh giấy tờ
  const [docLinks, setDocLinks] = useState([]); // Link ảnh nhập tay
  const [linkInput, setLinkInput] = useState(''); // Ô nhập link
  const [isUploading, setIsUploading] = useState(false);
  const [transferData, setTransferData] = useState({ toAddress: '', note: '' });
  const [deliveryNote, setDeliveryNote] = useState(''); // Ghi chú kết thúc
  const [transfering, setTransfering] = useState(false);
  const [delivering, setDelivering] = useState(false);
  console.log(window.location.origin);
  
  const fetchMyInventory = async () => {
    if (!contract || !currentAccount) return;
    setLoading(true);
    const tempBatches = [];

    try {
      // 1. Lấy địa chỉ Admin từ hợp đồng
      const adminAddress = await contract.admin();
      const totalBatches = await contract.batchCount();
      const userAddr = currentAccount.toLowerCase();
      const contractAdmin = adminAddress.toLowerCase();
      const isAdmin = userAddr === contractAdmin;

      console.log("Tổng số lô hàng:", Number(totalBatches));
      console.log("Ví của bạn:", userAddr);
      console.log("Admin của Contract:", contractAdmin);
      console.log("Quyền Admin:", isAdmin);

      for (let i = 0; i < Number(totalBatches); i++) {
        try {
          const bCode = await contract.allBatchCodes(i);
          const batch = await contract.getBatchDetails(bCode);
          
          // CÁCH TRUY XUẤT AN TOÀN TUYỆT ĐỐI (Hỗ trợ cả Array và Object)
          const b_name = batch.name || batch[0];
          const b_manuf = batch.manufacturer || batch[1];
          const b_owner = (batch.currentOwner || batch[2] || "").toString().toLowerCase();
          const b_creator = (batch.creator || batch[3] || "").toString().toLowerCase();
          const b_status = batch.status !== undefined ? Number(batch.status) : Number(batch[4]);
          
          const userAddr = currentAccount.toLowerCase();

          // Kiểm tra quyền sở hữu thực tế trên Blockchain
          const isOwnerOnChain = b_owner === userAddr || b_creator === userAddr || isAdmin;

          if (isAdmin || b_owner === userAddr || b_creator === userAddr) {
            tempBatches.push({
              id: bCode.toString(),
              name: b_name,
              manufacturer: b_manuf,
              status: b_status,
              isOwnerOnChain: isOwnerOnChain // Lưu lại quyền thực tế
            });
          }
        } catch (e) {
          console.log(`Lô tại index #${i} không tồn tại hoặc lỗi:`, e.message);
        }
      }
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

    try {
      setTransfering(true);
      
      const tx = await contract.transferBatch(
        selectedBatch.id, 
        transferData.toAddress, 
        transferData.note
      );
      await tx.wait(); // Chờ xác nhận thành công trên Blockchain

      // KHÔNG XÓA KHỎI FIREBASE NỮA - CHỈ CẬP NHẬT TRẠNG THÁI NẾU CẦN
      // (Hoặc giữ nguyên để có thể chuyển đi nhiều lần)

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

    try {
      setDelivering(true);
      
      // KIỂM TRA TRƯỚC KHI GỬI
      console.log("--- ĐANG KIỂM TRA TRƯỚC KHI KẾT THÚC ---");
      console.log("ID Lô hàng:", deliveryBatch.id);
      console.log("Ví của bạn:", currentAccount);
      
      const batchInfo = await contract.getBatchDetails(deliveryBatch.id);
      console.log("Chủ sở hữu trên Contract:", batchInfo.currentOwner);
      console.log("Người tạo trên Contract:", batchInfo.creator);
      const adminAddr = await contract.admin();
      console.log("Admin trên Contract:", adminAddr);

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
    if (!contract || !docsBatch || (docFiles.length === 0 && docLinks.length === 0)) {
      return alert("Vui lòng chọn file hoặc nhập ít nhất một link ảnh!");
    }

    try {
      setIsUploading(true);
      
      // --- BƯỚC 1: KIỂM TRA QUYỀN TRƯỚC KHI GỬI (PRE-FLIGHT CHECK) ---
      console.log("--- ĐANG KIỂM TRA QUYỀN TRÊN BLOCKCHAIN ---");
      const signerAddr = await contract.runner.getAddress();
      const batchId = BigInt(docsBatch.id);
      
      // Lấy thông tin thực tế từ Blockchain để đối chiếu
      const batchInfo = await contract.getBatchDetails(batchId);
      const contractAdmin = await contract.admin();
      
      // Lấy danh sách giấy tờ hiện có để tránh bị ghi đè mất cái cũ
      let existingDocs = [];
      try {
        existingDocs = await contract.getBatchDocuments(batchId);
        console.log("Giấy tờ hiện có trên Blockchain:", existingDocs);
      } catch (e) {
        console.log("Lô này chưa có giấy tờ cũ.");
      }
      
      const isOwner = batchInfo.currentOwner.toLowerCase() === signerAddr.toLowerCase();
      const isCreator = batchInfo.creator.toLowerCase() === signerAddr.toLowerCase();
      const isContractAdmin = contractAdmin.toLowerCase() === signerAddr.toLowerCase();

      console.log("Ví đang dùng:", signerAddr);
      console.log("Admin hợp đồng:", contractAdmin);
      console.log("Chủ lô hàng:", batchInfo.currentOwner);
      console.log("Quyền: Owner?", isOwner, "| Creator?", isCreator, "| Admin?", isContractAdmin);

      if (!isOwner && !isCreator && !isContractAdmin) {
        throw new Error(`Bạn không có quyền sửa lô này. \n- Ví hiện tại: ${signerAddr.slice(0,6)}...\n- Lô này thuộc về: ${batchInfo.currentOwner.slice(0,6)}...`);
      }

      // --- BƯỚC 2: TẢI ẢNH LÊN FIREBASE (NẾU CÓ) ---
      const uploadedUrls = [];
      if (docFiles.length > 0) {
        for (let i = 0; i < docFiles.length; i++) {
          const file = docFiles[i];
          // Kiểm tra kích thước file (Giới hạn 5MB để tránh quá tải)
          if (file.size > 5 * 1024 * 1024) {
             throw new Error(`File ${file.name} quá lớn (>5MB). Vui lòng chọn file nhỏ hơn.`);
          }
          
          console.log(`Đang tải file ${i + 1}/${docFiles.length}: ${file.name}...`);
          try {
            // Tên file chuẩn hóa để tránh lỗi ký tự đặc biệt trong URL
            const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            const storageRef = ref(storage, `batch_docs/${docsBatch.id}/${fileName}`);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            uploadedUrls.push(url);
          } catch (storageErr) {
            console.error("Lỗi tại Firebase Storage:", storageErr);
            throw new Error(`Không thể tải file ${file.name} lên máy chủ.`);
          }
        }
      }

      // Gộp và chuẩn hóa (Trim spaces) các link nhập tay
      const cleanDocLinks = docLinks.map(link => link.trim()).filter(link => link.length > 0);
      
      // GỘP CẢ CÁI CŨ + FILE MỚI + LINK MỚI
      const allUrls = [...existingDocs, ...uploadedUrls, ...cleanDocLinks];

      if (allUrls.length === 0) {
        throw new Error("Không có dữ liệu hợp lệ để cập nhật.");
      }

      // --- BƯỚC 3: GỬI GIAO DỊCH BLOCKCHAIN ---
      console.log("--- GỬI BLOCKCHAIN (PHƯƠNG ÁN TỐI GIẢN) ---");
      console.log("Dữ liệu gửi đi:", { finalBatchId: docsBatch.id, allUrls });
      
      const finalBatchId = BigInt(docsBatch.id);
      
      // Gửi giao dịch và ép buộc Gas cao (1M) để hỗ trợ các bộ hồ sơ/URL dài/phức tạp
      const tx = await contract.updateBatchDocuments(finalBatchId, allUrls, {
        gasLimit: 1000000 
      });
      
      console.log("Đang chờ xác nhận... Hash:", tx.hash);
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        alert("✅ Thành công! Giấy tờ đã được lưu lên Blockchain.");
        setDocsBatch(null);
        setDocsFiles([]);
        setDocLinks([]);
        setLinkInput('');
        fetchMyInventory();
      } else {
        throw new Error("Giao dịch bị thất bại trên Blockchain (Status 0)");
      }
    } catch (error) {
      console.error("LỖI CHI TIẾT:", error);
      // Hiển thị thông báo lỗi thân thiện
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="text-primary" /> Kho Hàng Của Tôi
        </h1>
        <button onClick={fetchMyInventory} className="text-sm text-primary hover:underline">
          Làm mới danh sách
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10"><Loader2 className="animate-spin mx-auto"/> Đang tải dữ liệu Blockchain...</div>
      ) : myBatches.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500">Kho hàng trống. Bạn chưa sở hữu lô thuốc nào.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myBatches.map((batch) => (
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
                
                {batch.status === 3 && (
                  <div className="h-[92px] flex items-center justify-center border border-dashed border-gray-200 rounded-lg bg-gray-50 text-gray-400 text-xs text-center px-4">
                    Lô hàng này đã hoàn tất hành trình và không thể chỉnh sửa thêm.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
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

              {/* Phần 1: Tải file lên */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tải ảnh từ máy tính</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-indigo-300 transition cursor-pointer relative">
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => setDocsFiles(Array.from(e.target.files))}
                  />
                  <div className="flex flex-col items-center">
                    <Upload size={30} className="text-indigo-500 mb-1" />
                    <p className="text-xs text-gray-600 font-medium">Chọn hoặc kéo thả ảnh</p>
                  </div>
                </div>
              </div>

              {/* Phần 2: Nhập link ảnh */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Hoặc nhập link ảnh trực tiếp</label>
                <div className="flex gap-2">
                  <input 
                    type="url"
                    placeholder="https://..."
                    className="flex-1 p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
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
                    className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold"
                  >
                    Thêm
                  </button>
                </div>
              </div>

              {/* Danh sách các file/link đã chọn */}
              {(docFiles.length > 0 || docLinks.length > 0) && (
                <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">Danh sách giấy tờ chuẩn bị lưu</p>
                  
                  {/* Files */}
                  {docFiles.map((f, i) => (
                    <div key={`file-${i}`} className="text-xs text-gray-600 flex items-center justify-between gap-2 mb-1 p-1 hover:bg-white rounded">
                      <div className="flex items-center gap-2 truncate">
                        <LucideImage size={12} className="text-indigo-400" />
                        <span className="truncate">{f.name}</span>
                      </div>
                      <button type="button" onClick={() => setDocsFiles(docFiles.filter((_, idx) => idx !== i))}>
                        <X size={12} className="text-red-400" />
                      </button>
                    </div>
                  ))}

                  {/* Links */}
                  {docLinks.map((link, i) => (
                    <div key={`link-${i}`} className="text-xs text-gray-600 flex items-center justify-between gap-2 mb-1 p-1 hover:bg-white rounded">
                      <div className="flex items-center gap-2 truncate text-blue-600 underline">
                        <FileText size={12} className="text-blue-400" />
                        <span className="truncate">{link}</span>
                      </div>
                      <button type="button" onClick={() => setDocLinks(docLinks.filter((_, idx) => idx !== i))}>
                        <X size={12} className="text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setDocsBatch(null);
                    setDocsFiles([]);
                    setDocLinks([]);
                    setLinkInput('');
                  }}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={isUploading || (docFiles.length === 0 && docLinks.length === 0)}
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
                value={`${window.location.origin}/tracking?id=${qrBatch.id}`} 
                size={200}
                level="H"
              />
            </div>

            <p className="text-center text-xs text-gray-400 mt-4 max-w-[200px]">
              Quét mã này để xem nguồn gốc và hành trình sản phẩm trên Blockchain.
            </p>

            <button 
              onClick={() => window.print()}
              className="mt-6 w-full py-3 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition"
            >
              <Printer size={18}/> In Tem Nhãn
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;