import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { useCart } from '../../context/CartContext';
import { 
  ShoppingCart, Search, Filter, ChevronDown, 
  Activity, Heart, Brain, Eye, Syringe, 
  Stethoscope, Sparkles, Thermometer, Droplets, 
  Baby, Bone, Pill, FlaskConical, Microscope, Shield
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PRODUCT_CATEGORIES } from '../../utils/categories';

// Ánh xạ icon cho các danh mục con (tùy chọn để giao diện đẹp hơn)
const SUB_CATEGORY_ICONS = {
  'Vitamin & Khoáng chất': FlaskConical,
  'Miễn dịch - Đề kháng': Shield,
  'Sinh lý - Nội tiết tố': Heart,
  'Mắt - Thị lực': Eye,
  'Tiêu hóa': Activity,
  'Thần kinh não': Brain,
  'Hỗ trợ làm đẹp': Sparkles,
  'Đường huyết - Tiểu đường': Droplets,
  'Tim mạch - Huyết áp': Heart,
  'Hô hấp - Tai mũi họng': Thermometer,
  'Cơ xương khớp': Bone,
};

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      console.log("🚀 Shop: Bắt đầu tải sản phẩm từ Supabase...");
      console.log("URL Supabase:", import.meta.env.VITE_SUPABASE_URL ? "Đã nạp" : "CHƯA CÓ");
      setLoading(true);
      
      const timeout = setTimeout(() => {
        console.warn("⚠️ Tải shop quá lâu (10s), ép buộc tắt spinner.");
        setLoading(false);
      }, 10000);

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("❌ Lỗi từ Supabase:", error.message, error.details, error.hint);
          throw error;
        }
        
        console.log("✅ Shop: Đã nạp thành công", data?.length || 0, "sản phẩm.");
        setProducts(data || []);
      } catch (error) {
        console.error("❌ Lỗi ngoại lệ khi tải shop:", error);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'Tất cả' || p.category === selectedCategory;
      const matchSubCategory = !selectedSubCategory || p.sub_category === selectedSubCategory;
      return matchSearch && matchCategory && matchSubCategory;
    });
  }, [products, searchTerm, selectedCategory, selectedSubCategory]);

  const currentCategoryObj = PRODUCT_CATEGORIES.find(c => c.name === selectedCategory);
  
  // Phân trang: 6 sản phẩm mỗi trang
  const [page, setPage] = useState(1);
  const perPage = 6;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / perPage));
  const start = (page - 1) * perPage;
  const visibleProducts = filteredProducts.slice(start, start + perPage);
  useEffect(() => { setPage(1); }, [searchTerm, selectedCategory, selectedSubCategory]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      
      {/* Banner Quảng Cáo */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 mb-6 text-white flex flex-col md:flex-row items-center justify-between shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Nhà Thuốc Chính Hãng MediTrack</h1>
          <p className="text-blue-100 opacity-90">Cam kết thuốc thật 100% - Truy xuất nguồn gốc bằng Blockchain</p>
        </div>
        <div className="mt-6 md:mt-0 relative z-10 flex gap-3">
           <button 
             onClick={() => setShowCategoryMenu(!showCategoryMenu)}
             className="bg-white/20 hover:bg-white/30 p-3 px-5 rounded-xl backdrop-blur-md flex items-center gap-2 transition font-bold border border-white/20"
           >
             <Filter size={20}/> Lọc theo danh mục
           </button>
        </div>
        {/* Background Decorative Circles */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Thanh Tìm kiếm & Lọc chính */}
      <div className="glass-card bg-white/60 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/30 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên thuốc hoặc sản phẩm..." 
            className="w-full pl-12 pr-4 py-3 bg-white/60 border border-white/40 rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['Tất cả', ...PRODUCT_CATEGORIES.map(c => c.name)].map(cat => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedSubCategory('');
              }}
              className={`px-5 py-3 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-2 ${
                selectedCategory === cat 
                ? 'bg-gray-900/90 text-white shadow-md' 
                : 'bg-white/60 text-gray-700 hover:bg-white'
              }`}
            >
              {cat === 'Thuốc' && <Pill size={16}/>}
              {cat === 'Thực phẩm chức năng' && <FlaskConical size={16}/>}
              {cat === 'Dược mỹ phẩm' && <Microscope size={16}/>}
              {cat}
              {cat !== 'Tất cả' && <ChevronDown size={14} className="opacity-50" />}
            </button>
          ))}
        </div>
      </div>

      {/* Layout Chính: Sidebar danh mục con & Grid sản phẩm */}
      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        
        {/* Sidebar Danh mục con */}
        <aside className="space-y-6 hidden lg:block">
          <div className="glass-card bg-white/60 backdrop-blur-md rounded-2xl border border-white/30 p-5 shadow-lg">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
              <Filter size={18} className="text-primary"/> Danh mục con
            </h2>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedSubCategory('')}
                className={`w-full text-left px-4 py-2.5 rounded-xl transition flex items-center gap-3 text-sm font-medium ${
                  !selectedSubCategory ? 'bg-primary text-white shadow-md shadow-blue-100' : 'text-gray-700 hover:bg-white'
                }`}
              >
                Tất cả {selectedCategory !== 'Tất cả' ? selectedCategory : ''}
              </button>
              
              {currentCategoryObj?.subCategories.map(sub => {
                const Icon = SUB_CATEGORY_ICONS[sub] || Pill;
                return (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubCategory(sub)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl transition flex items-center gap-3 text-sm font-medium ${
                      selectedSubCategory === sub ? 'bg-primary text-white shadow-md shadow-blue-100' : 'text-gray-700 hover:bg-white'
                    }`}
                  >
                    <Icon size={16} className={selectedSubCategory === sub ? 'text-white' : 'text-gray-400'} />
                    {sub}
                  </button>
                );
              })}
              
              {!currentCategoryObj && (
                <p className="text-xs text-gray-400 text-center py-4 italic">Hãy chọn danh mục chính để xem các tiểu mục</p>
              )}
            </div>
          </div>
        </aside>

        {/* Danh sách sản phẩm */}
        <div>
          {/* Label kết quả */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-500 font-medium">
              Hiển thị <span className="text-gray-900 font-bold">{visibleProducts.length}</span> / {filteredProducts.length} sản phẩm
              {selectedCategory !== 'Tất cả' && <span> trong <span className="text-primary font-bold">{selectedCategory}</span></span>}
              {selectedSubCategory && <span> › <span className="text-primary font-bold">{selectedSubCategory}</span></span>}
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50"
                disabled={page === 1}
              >←</button>
              <span className="text-sm font-bold">Trang {page}/{totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50"
                disabled={page === totalPages}
              >→</button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-gray-500 font-medium">Đang nạp danh sách sản phẩm...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center">
              <Search size={48} className="text-gray-200 mb-4" />
              <p className="text-gray-500 font-bold text-lg mb-1">Không tìm thấy sản phẩm</p>
              <p className="text-gray-400 text-sm">Hãy thử đổi từ khóa tìm kiếm hoặc danh mục khác</p>
              <button 
                onClick={() => {setSearchTerm(''); setSelectedCategory('Tất cả'); setSelectedSubCategory('');}}
                className="mt-6 text-primary font-bold hover:underline"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {visibleProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer"
                  onClick={(e) => {
                    if ((e.target.closest('button'))) return;
                    navigate(`/product/${product.id}`);
                  }}
                >
                  
                  {/* Ảnh sản phẩm */}
                  <div className="h-56 bg-gray-50 overflow-hidden relative p-6">
                    <Link to={`/product/${product.id}`}>
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
                      />
                    </Link>
                    {/* Badge tồn kho */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold rounded-lg shadow-sm text-gray-600 border border-gray-100">
                      Còn: {product.total_stock || 0}
                    </div>
                    {/* Badge Danh mục */}
                    {product.category && (
                      <div className="absolute top-3 left-3 bg-indigo-600 text-white px-2.5 py-1 text-[10px] font-bold rounded-lg shadow-sm">
                        {product.category}
                      </div>
                    )}
                  </div>

                  {/* Thông tin */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="mb-2">
                       <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">{product.sub_category || 'Sản phẩm'}</p>
                       <Link to={`/product/${product.id}`} className="hover:text-primary transition-colors" title={product.name}>
                        <h3 className="font-bold text-gray-800 text-lg leading-tight break-words whitespace-normal">{product.name}</h3>
                      </Link>
                    </div>
                    
                    <p className="text-gray-500 text-xs mb-5 clamp-2 flex-1">{product.description}</p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                      <div className="flex flex-col">
                         <span className="text-gray-400 text-[10px] line-through decoration-gray-300">{(product.price * 1.1).toLocaleString()} ₫</span>
                         <span className="text-primary font-black text-xl leading-none">
                          {product.price?.toLocaleString()} ₫
                        </span>
                      </div>
                      
                      {product.total_stock > 0 ? (
                        <button 
                          onClick={() => addToCart(product)}
                          className="bg-primary hover:bg-blue-700 text-white p-3 rounded-xl transition-all shadow-md shadow-blue-100 active:scale-90 flex items-center gap-2 group/btn"
                        >
                          <ShoppingCart size={18} className="group-hover/btn:animate-bounce" />
                        </button>
                      ) : (
                        <span className="text-red-500 text-[10px] font-bold bg-red-50 px-2 py-1 rounded-lg border border-red-100">Hết hàng</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Điều hướng trang dưới cùng */}
          {!loading && filteredProducts.length > 0 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
                disabled={page === 1}
              >Trang trước</button>
              <span className="text-sm font-bold">Trang {page}/{totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
                disabled={page === totalPages}
              >Trang sau</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
