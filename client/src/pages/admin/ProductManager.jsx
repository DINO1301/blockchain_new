import React, { useState } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc } from 'firebase/firestore'; 
import { Plus, Save, Loader2, Image as ImageIcon, Pill, Clock, ShieldAlert, FileText, Archive } from 'lucide-react';

const ProductManager = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    imageUrl: '',
    imageUrlsText: '',
    dosageForm: '',
    expiryMonths: '',
    ingredients: '',
    uses: '',
    directions: '',
    sideEffects: '',
    storage: '',
    precautions: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Lưu vào collection "products" trong Firebase
      const extraUrls = (formData.imageUrlsText || '')
        .split(',')
        .map(u => u.trim())
        .filter(u => u.length > 0);
      await addDoc(collection(db, "products"), {
        name: formData.name,
        price: Number(formData.price),
        description: formData.description,
        imageUrl: formData.imageUrl || extraUrls[0] || 'https://placehold.co/400', // Ảnh mặc định nếu trống
        imageUrls: extraUrls,
        dosageForm: formData.dosageForm || '',
        expiryMonths: formData.expiryMonths ? Number(formData.expiryMonths) : null,
        ingredients: formData.ingredients || '',
        uses: formData.uses || '',
        directions: formData.directions || '',
        sideEffects: formData.sideEffects || '',
        storage: formData.storage || '',
        precautions: formData.precautions || '',
        createdAt: new Date().toISOString()
      });
      alert("✅ Đã thêm sản phẩm mẫu thành công!");

      setFormData({ 
        name: '', 
        price: '', 
        description: '', 
        imageUrl: '',
        imageUrlsText: '',
        dosageForm: '',
        expiryMonths: '',
        ingredients: '',
        uses: '',
        directions: '',
        sideEffects: '',
        storage: '',
        precautions: ''
      }); // Reset form
    } catch (error) {
      console.error("Lỗi thêm sản phẩm:", error);
      alert("Lỗi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        
        <div className="flex items-center gap-3 mb-8 border-b pb-4">
          <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
            <Plus size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Thêm Sản Phẩm Mẫu</h1>
            <p className="text-gray-500 text-sm">Tạo dữ liệu cho Shop (Web2) trước khi sản xuất lô hàng (Web3)</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
          
          {/* Cột trái: Thông tin */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên thuốc / Sản phẩm</label>
              <input
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="VD: Panadol Extra"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán niêm yết (VNĐ)</label>
              <input
                required
                type="number"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="VD: 50000"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Pill size={14}/> Dạng bào chế</label>
                <input
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="VD: Viên nén bao phim"
                  value={formData.dosageForm}
                  onChange={e => setFormData({...formData, dosageForm: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Clock size={14}/> Hạn sử dụng (tháng)</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="VD: 36"
                  value={formData.expiryMonths}
                  onChange={e => setFormData({...formData, expiryMonths: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><FileText size={14}/> Mô tả công dụng</label>
              <textarea
                required
                rows="4"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="VD: Giảm đau, hạ sốt nhanh chóng..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><FileText size={14}/> Thành phần</label>
              <textarea
                rows="3"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Mỗi viên chứa..."
                value={formData.ingredients}
                onChange={e => setFormData({...formData, ingredients: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><FileText size={14}/> Công dụng</label>
                <textarea
                  rows="3"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Chỉ định, điều trị..."
                  value={formData.uses}
                  onChange={e => setFormData({...formData, uses: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><FileText size={14}/> Cách dùng</label>
                <textarea
                  rows="3"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Liều dùng, thời điểm..."
                  value={formData.directions}
                  onChange={e => setFormData({...formData, directions: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><ShieldAlert size={14}/> Tác dụng phụ</label>
                <textarea
                  rows="3"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Buồn ngủ, chóng mặt..."
                  value={formData.sideEffects}
                  onChange={e => setFormData({...formData, sideEffects: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Archive size={14}/> Bảo quản</label>
                <textarea
                  rows="3"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Nhiệt độ, tránh ẩm..."
                  value={formData.storage}
                  onChange={e => setFormData({...formData, storage: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><ShieldAlert size={14}/> Lưu ý</label>
              <textarea
                rows="3"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Chống chỉ định, thận trọng..."
                value={formData.precautions}
                onChange={e => setFormData({...formData, precautions: e.target.value})}
              />
            </div>
          </div>

          {/* Cột phải: Hình ảnh & Preview */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link Ảnh sản phẩm (URL)</label>
              <div className="flex gap-2">
                <input
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                />
                <div className="p-2 bg-gray-100 rounded border">
                   <ImageIcon size={20} className="text-gray-500"/>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">*Tip: Bạn có thể copy link ảnh từ Google Images dán vào đây.</p>
            </div>

            {/* Preview Ảnh chính */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl h-48 flex items-center justify-center overflow-hidden bg-gray-50 relative">
              {formData.imageUrl ? (
                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain" />
              ) : (
                <span className="text-gray-400 text-sm">Xem trước hình ảnh</span>
              )}
            </div>

            {/* Ảnh bổ sung */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh sách ảnh bổ sung (phân tách bằng dấu phẩy)</label>
              <textarea
                rows="3"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="https://..., https://..., ..."
                value={formData.imageUrlsText}
                onChange={e => setFormData({...formData, imageUrlsText: e.target.value})}
              />
              <div className="mt-3 grid grid-cols-4 gap-2">
                {(formData.imageUrlsText || '').split(',').map(u => u.trim()).filter(Boolean).map((u, i) => (
                  <div key={i} className="w-full h-16 border rounded overflow-hidden">
                    <img src={u} className="w-full h-full object-cover" alt={`extra-${i}`} />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition shadow-lg"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Lưu Sản Phẩm</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ProductManager;
