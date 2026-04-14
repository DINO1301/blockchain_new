import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../../context/Web3Context';
import { supabase } from '../../services/supabase';
import { PackagePlus, Loader2, CheckCircle, AlertCircle, Box } from 'lucide-react';

const Dashboard = () => {
  const { contract, currentAccount } = useContext(Web3Context);
  
  // State
  const [products, setProducts] = useState([]); // Danh sách sản phẩm từ Supabase
  const [selectedProduct, setSelectedProduct] = useState(''); // ID sản phẩm đang chọn
  const [batchCode, setBatchCode] = useState(''); // MÃ LÔ NHẬP TAY
  const [quantity, setQuantity] = useState(100); // Số lượng thuốc trong lô này
  const [manufacturer, setManufacturer] = useState(''); // Tên nhà máy (nhập tay hoặc lấy từ profile)
  
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // 1. Lấy danh sách sản phẩm mẫu từ Supabase khi vào trang
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error("Lỗi lấy sản phẩm:", error);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // 2. Xử lý Tạo Lô (Quy trình Hybrid)
  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return alert("Vui lòng chọn sản phẩm mẫu!");
    
    if (!currentAccount) {
      return alert("⚠️ Vui lòng kết nối ví MetaMask để thực hiện giao dịch này!");
    }

    // KIỂM TRA CONTRACT CÓ QUYỀN GHI (SIGNER) CHƯA
    if (!contract || !contract.runner || typeof contract.runner.sendTransaction !== 'function') {
      return alert("⚠️ Lỗi: Contract đang ở chế độ Read-only. Vui lòng kết nối lại ví hoặc tải lại trang.");
    }

    setStatus({ loading: true, error: '', success: '' });

    try {
      if (!contract) throw new Error("Chưa kết nối Smart Contract");

      // A. Tìm thông tin sản phẩm mẫu
      const productInfo = products.find(p => p.id === selectedProduct);
      
      // B. GHI BLOCKCHAIN
      
      const numericBatchCode = Number(batchCode);
      if (isNaN(numericBatchCode) || numericBatchCode <= 0) {
        throw new Error("Mã lô phải là một số lớn hơn 0");
      }

      // KIỂM TRA TRƯỚC: Lô này đã tồn tại chưa?
      const checkBatch = await contract.batches(numericBatchCode);
      if (checkBatch.isExists) {
        throw new Error(`Mã lô ${numericBatchCode} đã tồn tại trên Blockchain! Vui lòng dùng số khác.`);
      }

      const tx = await contract.createBatch(numericBatchCode, productInfo.name, manufacturer);
      await tx.wait(); 

      // C. CẬP NHẬT SUPABASE
      
      // Bước 1: Lấy dữ liệu cũ về
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('batches, total_stock')
        .eq('id', selectedProduct)
        .single();
      
      if (fetchError) throw fetchError;

      const currentBatches = currentProduct.batches || [];
      const newBatchObj = {
        id: batchCode.toString(),
        qty: Number(quantity),
        expiryDate: "2026-01-01",
        createdAt: new Date().toISOString()
      };

      const updatedBatches = [...currentBatches, newBatchObj];
      const updatedStock = (Number(currentProduct.total_stock) || 0) + Number(quantity);

      const { error: updateError } = await supabase
        .from('products')
        .update({
          batches: updatedBatches,
          total_stock: updatedStock
        })
        .eq('id', selectedProduct);

      if (updateError) throw updateError;

      setStatus({ 
        loading: false, 
        error: '', 
        success: `Thành công! Lô ${batchCode} (SL: ${quantity}) đã được nhập kho.` 
      });
      
      setSelectedProduct('');
      setBatchCode('');
      setQuantity(100);

    } catch (err) {
      console.error(err);
      setStatus({ loading: false, error: err.message || "Có lỗi xảy ra", success: '' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        
        <div className="flex items-center gap-3 mb-8 border-b pb-4">
          <div className="p-3 bg-blue-100 rounded-full text-primary">
            <PackagePlus size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Sản Xuất Lô Thuốc Mới</h1>
            <p className="text-gray-500 text-sm">Chọn mẫu từ Web2 - Đúc thành Token trên Web3</p>
          </div>
        </div>

        <form onSubmit={handleCreateBatch} className="space-y-6">
          
          {/* Chọn Sản Phẩm (Dropdown) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chọn Sản Phẩm Mẫu</label>
            {isLoadingProducts ? (
              <div className="p-3 bg-gray-50 text-gray-500 rounded text-sm">Đang tải danh sách...</div>
            ) : (
              <div className="relative">
                <select
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none appearance-none bg-white"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                >
                  <option value="">-- Chọn loại thuốc để sản xuất --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Giá: {p.price.toLocaleString()}đ)
                    </option>
                  ))}
                </select>
                <Box className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              *Dữ liệu này được lấy từ Supabase.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Mã Lô */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mã Lô (Số)</label>
              <input
                type="number"
                required
                placeholder="VD: 101"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
              />
            </div>

            {/* Nhà sản xuất */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nhà Sản Xuất / Nhà Máy</label>
              <input
                type="text"
                required
                placeholder="VD: GSK Bình Dương"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
              />
            </div>
          </div>

          {/* Số lượng (Web2 Only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng sản xuất (Hộp)</label>
            <input
              type="number"
              required
              min="1"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">*Sẽ cập nhật vào tồn kho Supabase.</p>
          </div>

          {/* Thông báo */}
          {status.error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{status.error}</span>
            </div>
          )}

          {status.success && (
            <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
              <CheckCircle size={20} />
              <span>{status.success}</span>
            </div>
          )}

          {/* Nút Submit */}
          <button
            type="submit"
            disabled={status.loading || !currentAccount}
            className={`w-full py-4 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all shadow-md
              ${status.loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg transform hover:-translate-y-0.5'}
            `}
          >
            {status.loading ? (
              <>
                <Loader2 className="animate-spin" /> Đang đồng bộ Web2 & Web3...
              </>
            ) : (
              "Xác nhận & Đồng bộ"
            )}
          </button>
          
          {!currentAccount && (
            <p className="text-center text-red-500 text-sm">Vui lòng kết nối ví (Liên kết ví) để thực hiện.</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Dashboard;