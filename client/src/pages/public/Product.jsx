import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { ShoppingCart, Clock, Pill, ShieldAlert, ChevronRight, FileText, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const sections = [
  { key: 'ingredients', label: 'Thành phần', icon: Pill },
  { key: 'uses', label: 'Công dụng', icon: FileText },
  { key: 'directions', label: 'Cách dùng', icon: FileText },
  { key: 'side_effects', label: 'Tác dụng phụ', icon: ShieldAlert },
  { key: 'precautions', label: 'Lưu ý', icon: ShieldAlert },
  { key: 'storage', label: 'Bảo quản', icon: FileText },
];

const Product = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const ingredientsRef = useRef(null);
  const usesRef = useRef(null);
  const directionsRef = useRef(null);
  const sideEffectsRef = useRef(null);
  const precautionsRef = useRef(null);
  const storageRef = useRef(null);
  const sectionRefs = {
    ingredients: ingredientsRef,
    uses: usesRef,
    directions: directionsRef,
    side_effects: sideEffectsRef,
    precautions: precautionsRef,
    storage: storageRef
  };
  const [activeKey, setActiveKey] = useState(sections[0].key);
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showRelatedDocs, setShowRelatedDocs] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        if (data) {
          setProduct(data);
          const imgs = Array.isArray(data.image_urls) ? data.image_urls : [];
          setSelectedImage(data.image_url || imgs[0] || '');
        }
      } catch (error) {
        console.error("Lỗi tải chi tiết sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const scrollTo = (key) => {
    setActiveKey(key);
  };

  const renderContent = (value) => {
    if (!value || !value.trim()) return 'Đang cập nhật';
    const parts = value.split(/[\n•;]+/).map(s => s.trim()).filter(Boolean);
    if (parts.length <= 1) return value;
    return (
      <ul className="list-disc pl-5 space-y-1">
        {parts.map((p, idx) => <li key={idx}>{p}</li>)}
      </ul>
    );
  };

  if (loading) {
    return <div className="max-w-6xl mx-auto p-6">Đang tải chi tiết...</div>;
  }

  if (!product) {
    return <div className="max-w-6xl mx-auto p-6">Không tìm thấy sản phẩm.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <div className="bg-gray-50 rounded-xl border h-96 md:h-[28rem] flex items-center justify-center overflow-hidden">
              <img src={selectedImage || product.image_url} alt={product.name} className="w-full h-full object-contain p-2" />
            </div>
            {Array.isArray(product.image_urls) && product.image_urls.length > 0 && (
              <div className="mt-4 flex gap-3 overflow-x-auto">
                {[...new Set([product.image_url, ...product.image_urls].filter(Boolean))].map((url, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setSelectedImage(url)}
                    className={`w-20 h-20 border rounded overflow-hidden ${selectedImage === url ? 'ring-2 ring-primary' : ''}`}
                  >
                    <img src={url} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Pill size={22} className="text-primary" /> {product.name}
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-2xl font-bold text-indigo-600">{product.price?.toLocaleString()} ₫</span>
              {product.expiry_months ? (
                <span className="inline-flex items-center gap-1 text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  <Clock size={16} /> HSD: {product.expiry_months} tháng
                </span>
              ) : null}
            </div>
            {/* Thông tin nhanh: chỉ 3 mục chính */}
            <div className="mt-5 bg-gray-50 border rounded-2xl p-5 space-y-4">
              <div className="flex gap-6">
                <div className="w-48 md:w-56 text-gray-500">Dạng bào chế</div>
                <div className="flex-1 text-gray-800">{product.dosage_form || 'Đang cập nhật'}</div>
              </div>
              <div className="flex gap-6">
                <div className="w-48 md:w-56 text-gray-500">Hạn sử dụng</div>
                <div className="flex-1 text-gray-800">{product.expiry_months ? `${product.expiry_months} tháng` : 'Đang cập nhật'}</div>
              </div>
              <div className="flex gap-6">
                <div className="w-48 md:w-56 text-gray-500">Mô tả ngắn</div>
                <div className="flex-1 text-gray-800">{product.description || 'Đang cập nhật'}</div>
              </div>
              
              <div className="flex gap-6 items-center">
                <div className="w-48 md:w-56 text-gray-500">Giấy tờ liên quan</div>
                <div className="flex-1">
                  {Array.isArray(product.related_docs) && product.related_docs.length > 0 ? (
                    <button 
                      onClick={() => setShowRelatedDocs(!showRelatedDocs)}
                      className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <FileText size={16} /> Xem các giấy tờ pháp lý ({product.related_docs.length})
                    </button>
                  ) : (
                    <span className="text-gray-400 italic text-sm">Chưa có giấy tờ liên quan</span>
                  )}
                </div>
              </div>

              <div className="flex gap-6 items-center">
                <div className="w-48 md:w-56 text-gray-500">QR liên quan</div>
                <div className="flex-1">
                  {Array.isArray(product.related_qrs) && product.related_qrs.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {product.related_qrs.map((url, idx) => (
                        <a 
                          key={idx} 
                          href={url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="w-10 h-10 border rounded-lg p-1 hover:border-primary transition bg-white"
                        >
                          <img src={url} alt="QR" className="w-full h-full object-contain" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 italic text-sm">Chưa có mã QR liên quan</span>
                  )}
                </div>
              </div>
            </div>

            {/* Hiển thị ảnh giấy tờ liên quan nếu được chọn */}
            {showRelatedDocs && Array.isArray(product.related_docs) && (
              <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wider">Danh sách giấy tờ pháp lý</h3>
                  <button onClick={() => setShowRelatedDocs(false)} className="text-indigo-400 hover:text-indigo-600">
                    <X size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {product.related_docs.map((url, idx) => (
                    <a 
                      key={idx} 
                      href={url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="aspect-[3/4] rounded-lg border bg-white overflow-hidden hover:ring-2 ring-indigo-500 transition shadow-sm group relative"
                    >
                      <img src={url} alt={`doc-${idx}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <span className="bg-white/90 px-2 py-1 rounded text-[10px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">Phóng to</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-gray-50 border rounded-lg">
                <button
                  className="px-3 py-2 text-lg"
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                >-</button>
                <input
                  type="number"
                  min="1"
                  className="w-16 text-center bg-transparent outline-none py-2"
                  value={qty}
                  onChange={e => {
                    const v = parseInt(e.target.value || '1', 10);
                    if (!isNaN(v)) setQty(Math.max(1, v));
                  }}
                />
                <button
                  className="px-3 py-2 text-lg"
                  onClick={() => setQty(q => q + 1)}
                >+</button>
              </div>
              <button
                onClick={() => addToCart(product, qty)}
                className="bg-primary hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-bold flex items-center gap-2"
              >
                <ShoppingCart size={20} /> Thêm vào giỏ
              </button>
              <Link to="/shop" className="px-5 py-3 rounded-lg border hover:bg-gray-50">Quay lại Shop</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <div className="bg-gray-50 rounded-xl border p-4 space-y-2 sticky top-24">
              <div className="text-xs font-bold text-gray-500">THÔNG TIN CHI TIẾT</div>
              {sections.map(s => {
                const Icon = s.icon || FileText;
                const isActive = activeKey === s.key;
                return (
                <button
                    key={s.key}
                    onClick={() => scrollTo(s.key)}
                    className={`w-full text-left px-3 py-2 rounded-lg group flex items-center justify-between ${isActive ? 'bg-white shadow text-primary' : 'hover:bg-white hover:shadow'}`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon size={16} className={isActive ? 'text-primary' : 'text-gray-400'} />
                      <span className={`text-sm ${isActive ? 'text-primary' : 'text-gray-700'}`}>{s.label}</span>
                    </span>
                    <ChevronRight size={16} className={isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'} />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="md:col-span-3">
            {(() => {
              const s = sections.find(sec => sec.key === activeKey) || sections[0];
              const Icon = s.icon || FileText;
              return (
                <div className="bg-white rounded-xl border p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={18} className="text-primary" />
                    <h2 className="text-lg font-bold">{s.label}</h2>
                  </div>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    {renderContent(product[s.key])}
                  </div>
                </div>
              );
            })()}
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 flex items-start gap-2 mt-6">
              <ShieldAlert className="mt-0.5" size={18} />
              <p className="text-sm">
                Thông tin chỉ mang tính tham khảo. Vui lòng đọc kỹ hướng dẫn sử dụng và hỏi ý kiến bác sĩ/dược sĩ.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Product;
