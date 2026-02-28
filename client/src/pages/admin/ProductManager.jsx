import React, { useState } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc } from 'firebase/firestore'; 
import { 
  Plus, Save, Loader2, Image as ImageIcon, Pill, Clock, ShieldAlert, FileText, Archive, 
  Package, CircleDollarSign, Calendar, Info, FlaskConical, Stethoscope, Activity, 
  AlertTriangle, Thermometer, Images, FileSearch 
} from 'lucide-react';

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
    precautions: '',
    relatedDocsText: ''
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
      
      const relatedDocUrls = (formData.relatedDocsText || '')
        .split(',')
        .map(u => u.trim())
        .filter(u => u.length > 0);

      await addDoc(collection(db, "products"), {
        name: formData.name,
        price: Number(formData.price),
        description: formData.description,
        imageUrl: formData.imageUrl || extraUrls[0] || 'https://placehold.co/400', // Ảnh mặc định nếu trống
        imageUrls: extraUrls,
        relatedDocs: relatedDocUrls,
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
        relatedDocsText: '',
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
    <div className="max-w-6xl mx-auto p-6">
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

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-10">
          
          {/* Cột trái & giữa: Thông tin chi tiết */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Package size={18} className="text-indigo-500"/> Tên thuốc / Sản phẩm
                </label>
                <input
                  required
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                  placeholder="VD: Panadol Extra"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <CircleDollarSign size={18} className="text-green-500"/> Giá bán niêm yết (VNĐ)
                </label>
                <input
                  required
                  type="number"
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                  placeholder="VD: 50000"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Pill size={18} className="text-blue-500"/> Dạng bào chế
                </label>
                <input
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                  placeholder="VD: Viên nén bao phim"
                  value={formData.dosageForm}
                  onChange={e => setFormData({...formData, dosageForm: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar size={18} className="text-orange-500"/> Hạn sử dụng (tháng)
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                  placeholder="VD: 36"
                  value={formData.expiryMonths}
                  onChange={e => setFormData({...formData, expiryMonths: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Info size={18} className="text-indigo-500"/> Mô tả công dụng
              </label>
              <textarea
                required
                rows="3"
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                placeholder="VD: Giảm đau, hạ sốt nhanh chóng..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <FlaskConical size={18} className="text-purple-500"/> Thành phần
              </label>
              <textarea
                rows="3"
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                placeholder="Mỗi viên chứa..."
                value={formData.ingredients}
                onChange={e => setFormData({...formData, ingredients: e.target.value})}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Stethoscope size={18} className="text-teal-500"/> Công dụng
                </label>
                <textarea
                  rows="3"
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                  placeholder="Chỉ định, điều trị..."
                  value={formData.uses}
                  onChange={e => setFormData({...formData, uses: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Activity size={18} className="text-blue-500"/> Cách dùng
                </label>
                <textarea
                  rows="3"
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                  placeholder="Liều dùng, thời điểm..."
                  value={formData.directions}
                  onChange={e => setFormData({...formData, directions: e.target.value})}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-500"/> Tác dụng phụ
                </label>
                <textarea
                  rows="3"
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                  placeholder="Buồn ngủ, chóng mặt..."
                  value={formData.sideEffects}
                  onChange={e => setFormData({...formData, sideEffects: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Thermometer size={18} className="text-orange-500"/> Bảo quản
                </label>
                <textarea
                  rows="3"
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                  placeholder="Nhiệt độ, tránh ẩm..."
                  value={formData.storage}
                  onChange={e => setFormData({...formData, storage: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <ShieldAlert size={18} className="text-amber-500"/> Lưu ý
              </label>
              <textarea
                rows="3"
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                placeholder="Chống chỉ định, thận trọng..."
                value={formData.precautions}
                onChange={e => setFormData({...formData, precautions: e.target.value})}
              />
            </div>
          </div>

          {/* Cột phải: Hình ảnh & Preview */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <ImageIcon size={18} className="text-indigo-500"/> Link Ảnh chính (URL)
                </label>
                <input
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white"
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                />
              </div>

              {/* Preview Ảnh chính */}
              <div className="border-2 border-dashed border-gray-300 rounded-2xl h-56 flex items-center justify-center overflow-hidden bg-white relative group">
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="text-center">
                    <ImageIcon size={40} className="mx-auto text-gray-300 mb-2" />
                    <span className="text-gray-400 text-xs font-medium">Xem trước hình ảnh</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Images size={18} className="text-indigo-500"/> Ảnh bổ sung (phân tách bằng dấu phẩy)
                </label>
                <textarea
                  rows="3"
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white text-sm"
                  placeholder="https://..., https://..."
                  value={formData.imageUrlsText}
                  onChange={e => setFormData({...formData, imageUrlsText: e.target.value})}
                />
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(formData.imageUrlsText || '').split(',').map(u => u.trim()).filter(Boolean).slice(0, 6).map((u, i) => (
                    <div key={i} className="w-full h-16 border rounded-lg overflow-hidden bg-white">
                      <img src={u} className="w-full h-full object-cover" alt={`extra-${i}`} />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FileSearch size={18} className="text-indigo-500"/> Giấy tờ liên quan (link ảnh)
                </label>
                <textarea
                  rows="3"
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white text-sm"
                  placeholder="https://..., https://..."
                  value={formData.relatedDocsText}
                  onChange={e => setFormData({...formData, relatedDocsText: e.target.value})}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition shadow-xl shadow-indigo-100 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Lưu Sản Phẩm</>}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ProductManager;
