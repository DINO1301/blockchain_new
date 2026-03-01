import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { 
  Plus, Save, Loader2, Image as ImageIcon, Pill, Clock, ShieldAlert, FileText, Archive, 
  Package, CircleDollarSign, Calendar, Info, FlaskConical, Stethoscope, Activity, 
  AlertTriangle, Thermometer, FileSearch, X, QrCode, Upload 
} from 'lucide-react';

const UploadSection = ({ title, field, value, icon: IconEl, colorClass, uploading, handleFileUpload, setFormData, formData }) => {
  const [localLink, setLocalLink] = useState('');
  const inputId = `upload-${field}`;
  const urls = (value || '').split(',').map(u => u.trim()).filter(u => u);

  // Hàm xóa ảnh/file khỏi danh sách
  const removeFile = (field, index) => {
    const targetField = field === 'extra' ? 'imageUrlsText' : 
                       field === 'docs' ? 'relatedDocsText' : 'relatedQRsText';
    
    const currentUrls = (formData[targetField] || '').split(',').map(u => u.trim()).filter(u => u);
    currentUrls.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      [targetField]: currentUrls.join(', ')
    }));
  };

  return (
    <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
          {IconEl ? <IconEl size={18} className={colorClass}/> : null} {title}
        </label>
      </div>

      {/* Vùng kéo thả */}
      <div 
        className={`border-2 border-dashed rounded-xl p-6 h-40 flex flex-col items-center justify-center transition cursor-pointer hover:bg-gray-50 ${
          uploading[field] ? 'border-gray-300 bg-gray-50' : 'border-indigo-100'
        }`}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            handleFileUpload({ target: { files } }, field);
          }
        }}
        onClick={() => document.getElementById(inputId).click()}
      >
        <input 
          id={inputId}
          type="file" 
          className="hidden" 
          accept={field === 'docs' ? "image/*,application/pdf" : "image/*"} 
          multiple={field !== 'main'} 
          onChange={(e) => handleFileUpload(e, field)} 
        />
        {uploading[field] ? (
          <Loader2 size={24} className="animate-spin text-indigo-500 mb-2" />
        ) : (
          <Upload size={24} className="text-indigo-500 mb-2" />
        )}
        <span className="text-xs text-gray-500 font-medium text-center">
          {uploading[field] ? "Đang tải lên..." : "Chọn hoặc kéo thả ảnh"}
        </span>
      </div>

      {/* Nhập link trực tiếp */}
      <div className="flex gap-2">
        <input 
          type="url"
          placeholder="https://..."
          className="flex-1 px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50"
          value={localLink}
          onChange={(e) => setLocalLink(e.target.value)}
        />
        <button 
          type="button"
          onClick={() => {
            if (localLink.trim()) {
              if (field === 'main') {
                setFormData(prev => ({ ...prev, imageUrl: localLink.trim() }));
              } else {
                const targetField = field === 'extra' ? 'imageUrlsText' : 
                                   field === 'docs' ? 'relatedDocsText' : 'relatedQRsText';
                setFormData(prev => ({ 
                  ...prev, 
                  [targetField]: prev[targetField] ? `${prev[targetField]}, ${localLink.trim()}` : localLink.trim() 
                }));
              }
              setLocalLink('');
            }
          }}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black transition shadow-sm"
        >
          Thêm
        </button>
      </div>

      {/* Danh sách file (chỉ cho các field multiple) */}
      {field !== 'main' && urls.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-gray-50">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">DANH SÁCH FILE ĐÃ THÊM</p>
          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
            {urls.map((url, i) => (
              <div key={i} className="flex items-center justify-between gap-2 p-1.5 bg-gray-50 rounded-lg group">
                <div className="flex items-center gap-2 truncate">
                  <FileText size={12} className="text-gray-400" />
                  <a href={url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 underline truncate hover:text-blue-700">
                    {url.split('/').pop().substring(0, 20)}...
                  </a>
                </div>
                <button 
                  type="button" 
                  onClick={() => removeFile(field, i)}
                  className="p-1 hover:bg-red-50 rounded text-red-400 opacity-0 group-hover:opacity-100 transition"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ProductManager = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState({ main: false, extra: false, docs: false, qrs: false });
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
    relatedDocsText: '',
    relatedQRsText: ''
  });

  // Hàm xử lý upload file lên Supabase Storage (Hỗ trợ nhiều file)
  const handleFileUpload = async (event, field) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Kiểm tra định dạng và dung lượng cho từng file
    const isDoc = field === 'docs';
    const allowedTypes = isDoc 
      ? ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      : ['image/jpeg', 'image/png', 'image/webp'];
    
    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        alert(`❌ File "${file.name}" không đúng định dạng.`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`❌ File "${file.name}" quá lớn (>5MB).`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(prev => ({ ...prev, [field]: true }));
    try {
      const uploadPromises = validFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `products/${fileName}`;

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

      // Cập nhật vào form tương ứng
      if (field === 'main') {
        // Ảnh chính chỉ lấy cái đầu tiên nếu chọn nhiều
        setFormData(prev => ({ ...prev, imageUrl: publicUrls[0] }));
      } else {
        const joinedUrls = publicUrls.join(', ');
        const targetField = field === 'extra' ? 'imageUrlsText' : 
                           field === 'docs' ? 'relatedDocsText' : 'relatedQRsText';
        
        setFormData(prev => ({ 
          ...prev, 
          [targetField]: prev[targetField] ? `${prev[targetField]}, ${joinedUrls}` : joinedUrls 
        }));
      }

      alert(`✅ Đã tải ${publicUrls.length} file lên thành công!`);
    } catch (error) {
      console.error("Lỗi upload:", error);
      alert("Lỗi upload: " + (error.message || "Không rõ lỗi"));
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }));
      event.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.name.trim()) {
        alert("Vui lòng nhập tên sản phẩm");
        setLoading(false);
        return;
      }
      if (formData.price === '' || Number(formData.price) <= 0 || Number.isNaN(Number(formData.price))) {
        alert("Giá bán phải là số > 0");
        setLoading(false);
        return;
      }
      if (!formData.description.trim()) {
        alert("Vui lòng nhập mô tả");
        setLoading(false);
        return;
      }
      // Gộp các link nhập tay
      const extraUrls = (formData.imageUrlsText || '')
        .split(',')
        .map(u => u.trim())
        .filter(u => u);
      
      const relatedDocUrls = (formData.relatedDocsText || '')
        .split(',')
        .map(u => u.trim())
        .filter(u => u);

      const relatedQrUrls = (formData.relatedQRsText || '')
        .split(',')
        .map(u => u.trim())
        .filter(u => u);

      const { error } = await supabase
        .from('products')
        .insert([{
          name: formData.name,
          price: Number(formData.price),
          description: formData.description,
          image_url: formData.imageUrl || extraUrls[0] || 'https://placehold.co/400',
          image_urls: extraUrls,
          related_docs: relatedDocUrls,
          related_qrs: relatedQrUrls,
          dosage_form: formData.dosageForm || '',
          expiry_months: formData.expiryMonths ? Number(formData.expiryMonths) : null,
          ingredients: formData.ingredients || '',
          uses: formData.uses || '',
          directions: formData.directions || '',
          side_effects: formData.sideEffects || '',
          storage: formData.storage || '',
          precautions: formData.precautions || '',
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      alert("✅ Đã thêm sản phẩm mẫu thành công!");

      setFormData({ 
        name: '', 
        price: '', 
        description: '', 
        imageUrl: '',
        imageUrlsText: '',
        relatedDocsText: '',
        relatedQRsText: '',
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
    <div className="max-w-[90rem] mx-auto p-6">
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

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-[2fr_1fr] gap-10">
          
          {/* Cột trái & giữa: Thông tin chi tiết */}
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Package size={18} className="text-indigo-500"/> Tên thuốc / Sản phẩm
                </label>
                <input
                  required
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
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
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
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
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
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
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
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
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30 min-h-36"
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
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30 min-h-36"
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
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30 min-h-36"
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
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30 min-h-36"
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
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30 min-h-36"
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
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30 min-h-36"
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
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30 min-h-40"
                placeholder="Chống chỉ định, thận trọng..."
                value={formData.precautions}
                onChange={e => setFormData({...formData, precautions: e.target.value})}
              />
            </div>
          </div>

          {/* Cột phải: Hình ảnh & Preview */}
          <div className="space-y-6">
            <UploadSection 
              title="Ảnh chính sản phẩm"
              field="main"
              value={formData.imageUrl}
              icon={ImageIcon}
              colorClass="text-indigo-500"
              uploading={uploading}
              handleFileUpload={handleFileUpload}
              setFormData={setFormData}
              formData={formData}
            />

            {/* Preview Ảnh chính */}
            <div className="bg-white border border-gray-100 rounded-2xl h-64 flex items-center justify-center overflow-hidden shadow-sm relative group">
              {formData.imageUrl ? (
                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="text-center">
                  <ImageIcon size={40} className="mx-auto text-gray-200 mb-2" />
                  <span className="text-gray-400 text-xs font-medium">Xem trước hình ảnh</span>
                </div>
              )}
            </div>

            <UploadSection 
              title="Giấy tờ liên quan"
              field="docs"
              value={formData.relatedDocsText}
              icon={FileSearch}
              colorClass="text-indigo-500"
              uploading={uploading}
              handleFileUpload={handleFileUpload}
              setFormData={setFormData}
              formData={formData}
            />

            <UploadSection 
              title="QR liên quan"
              field="qrs"
              value={formData.relatedQRsText}
              icon={QrCode}
              colorClass="text-indigo-500"
              uploading={uploading}
              handleFileUpload={handleFileUpload}
              setFormData={setFormData}
              formData={formData}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition shadow-xl shadow-indigo-100 disabled:opacity-50"
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
