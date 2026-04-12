import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { useCart } from '../../context/CartContext';
import { 
  ShoppingCart, Search, Filter, ChevronDown, ChevronUp,
  Activity, Heart, Brain, Eye, Syringe, 
  Stethoscope, Sparkles, Thermometer, Droplets, 
  Baby, Bone, Pill, FlaskConical, Microscope, Shield,
  Check, X, Globe, Building2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PRODUCT_CATEGORIES } from '../../utils/categories';

// Ánh xạ icon cho các danh mục con
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
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  
  const [countrySearch, setCountrySearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    country: true,
    brand: true
  });
  
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const fetchProducts = async () => {
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
  useEffect(() => {
    fetchProducts();
  }, []);

  // Lấy danh sách nước và thương hiệu duy nhất từ sản phẩm
  const uniqueCountries = useMemo(() => {
    const countriesFromDB = products
      .map(p => p.origin_country)
      .filter((v, i, a) => v && a.indexOf(v) === i);
    
    // Đảm bảo luôn có một số nước mẫu nếu DB ít dữ liệu
    const defaults = ['Việt Nam', 'Hoa Kỳ', 'Nhật Bản', 'Úc', 'Pháp', 'Đức', 'Hàn Quốc'];
    const combined = [...new Set([...countriesFromDB, ...defaults])];
    return combined.sort();
  }, [products]);

  const uniqueBrands = useMemo(() => {
    const brandsFromDB = products
      .map(p => p.manufacturer)
      .filter((v, i, a) => v && a.indexOf(v) === i);
    
    const defaults = ['Stella Pharm', 'Abbott', 'Hasan', 'Jpanwell', 'DHG Pharma', 'Traphaco'];
    const combined = [...new Set([...brandsFromDB, ...defaults])];
    return combined.sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'Tất cả' || p.category === selectedCategory;
      const matchSubCategory = !selectedSubCategory || p.sub_category === selectedSubCategory;
      
      // Lọc theo giá
      let matchPrice = true;
      if (selectedPriceRange === 'under100') matchPrice = p.price < 100000;
      else if (selectedPriceRange === '100-300') matchPrice = p.price >= 100000 && p.price <= 300000;
      else if (selectedPriceRange === '300-500') matchPrice = p.price > 300000 && p.price <= 500000;
      else if (selectedPriceRange === 'over500') matchPrice = p.price > 500000;

      // Lọc theo nước sản xuất
      const matchCountry = selectedCountries.length === 0 || selectedCountries.includes(p.origin_country || 'Việt Nam');

      // Lọc theo thương hiệu
      const matchBrand = selectedBrands.length === 0 || selectedBrands.includes(p.manufacturer || 'Khác');

      return matchSearch && matchCategory && matchSubCategory && matchPrice && matchCountry && matchBrand;
    });
  }, [products, searchTerm, selectedCategory, selectedSubCategory, selectedPriceRange, selectedCountries, selectedBrands]);

  const currentCategoryObj = PRODUCT_CATEGORIES.find(c => c.name === selectedCategory);
  const showSubCategories = selectedCategory === 'Thực phẩm chức năng' || selectedCategory === 'Dược mỹ phẩm' || selectedCategory === 'Thuốc';
  
  // Phân trang
  const [page, setPage] = useState(1);
  const perPage = 6;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / perPage));
  const start = (page - 1) * perPage;
  const visibleProducts = filteredProducts.slice(start, start + perPage);
  
  useEffect(() => { 
    setPage(1); 
  }, [searchTerm, selectedCategory, selectedSubCategory, selectedPriceRange, selectedCountries, selectedBrands]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleFilter = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      
      {/* Banner Quảng Cáo */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 mb-6 text-white flex flex-col md:flex-row items-center justify-between shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Nhà Thuốc Chính Hãng MediTrack</h1>
          <p className="text-blue-100 opacity-90">Cam kết thuốc thật 100% - Truy xuất nguồn gốc bằng Blockchain</p>
        </div>
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

      {/* Layout Chính: Sidebar bộ lọc nâng cao & Grid sản phẩm */}
      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        
        {/* Sidebar Bộ lọc nâng cao */}
        <aside className="space-y-6 hidden lg:block lg:sticky lg:top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-4 custom-scrollbar">
          
          {/* 1. Danh mục con (Chỉ hiện khi chọn danh mục chính phù hợp) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm min-h-[320px] flex flex-col">
            <h2 className="font-bold text-gray-800 mb-5 flex items-center gap-2 text-lg">
              <Filter size={20} className="text-primary"/> Danh mục con
            </h2>
            <div className="space-y-3 flex-1">
              <button
                onClick={() => setSelectedSubCategory('')}
                className={`w-full py-3.5 rounded-2xl transition text-sm font-black tracking-tight ${
                  !selectedSubCategory ? 'bg-primary text-white shadow-lg shadow-blue-100' : 'bg-gray-50 text-gray-400'
                }`}
              >
                Tất cả
              </button>
              
              {showSubCategories && currentCategoryObj?.subCategories.map(sub => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubCategory(sub)}
                  className={`w-full text-left px-5 py-3 rounded-2xl transition text-xs font-bold ${
                    selectedSubCategory === sub ? 'bg-blue-50 text-primary border-2 border-primary/20' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {sub}
                </button>
              ))}
              
              {!showSubCategories && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-40 py-10">
                   <Filter size={32} className="text-gray-300" />
                   <p className="text-[11px] text-gray-400 italic leading-relaxed px-2">
                     Hãy chọn danh mục chính để xem các tiểu mục
                   </p>
                </div>
              )}
            </div>
          </div>

          {/* 2. Giá bán */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm min-h-[320px]">
            <button 
              onClick={() => toggleSection('price')}
              className="w-full flex items-center justify-between mb-5"
            >
              <h2 className="font-black text-gray-800 text-xs uppercase tracking-widest">Giá bán</h2>
              {expandedSections.price ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
            </button>
            
            {expandedSections.price && (
              <div className="space-y-3">
                {[
                  { label: 'Dưới 100.000đ', value: 'under100' },
                  { label: '100.000đ đến 300.000đ', value: '100-300' },
                  { label: '300.000đ đến 500.000đ', value: '300-500' },
                  { label: 'Trên 500.000đ', value: 'over500' }
                ].map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setSelectedPriceRange(selectedPriceRange === range.value ? 'all' : range.value)}
                    className={`w-full text-center py-3.5 rounded-2xl border-2 transition-all text-xs font-bold ${
                      selectedPriceRange === range.value 
                      ? 'border-primary bg-blue-50 text-primary' 
                      : 'border-gray-100 text-gray-500 hover:border-gray-200 bg-white'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Nước sản xuất */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm min-h-[320px]">
            <button 
              onClick={() => toggleSection('country')}
              className="w-full flex items-center justify-between mb-5"
            >
              <h2 className="font-black text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2">
                <Globe size={18} className="text-gray-400"/> Nước sản xuất
              </h2>
              {expandedSections.country ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
            </button>

            {expandedSections.country && (
              <div className="space-y-4">
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input 
                    type="text" 
                    placeholder="Tìm theo tên" 
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                  />
                </div>
                
                <div className="space-y-3 pr-1">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-md border-2 border-gray-200 checked:bg-primary checked:border-primary transition-all cursor-pointer"
                      checked={selectedCountries.length === 0}
                      onChange={() => setSelectedCountries([])}
                    />
                    <span className={`text-xs font-bold ${selectedCountries.length === 0 ? 'text-primary' : 'text-gray-500 group-hover:text-gray-700'}`}>Tất cả</span>
                  </label>
                  
                  {uniqueCountries
                    .filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()))
                    .map(country => (
                      <label key={country} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded-md border-2 border-gray-200 checked:bg-primary checked:border-primary transition-all cursor-pointer"
                          checked={selectedCountries.includes(country)}
                          onChange={() => toggleFilter(selectedCountries, setSelectedCountries, country)}
                        />
                        <span className={`text-xs font-bold transition-colors ${selectedCountries.includes(country) ? 'text-primary' : 'text-gray-500 group-hover:text-gray-700'}`}>
                          {country}
                        </span>
                      </label>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Thương hiệu */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm min-h-[320px]">
            <button 
              onClick={() => toggleSection('brand')}
              className="w-full flex items-center justify-between mb-5"
            >
              <h2 className="font-black text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2">
                <Building2 size={18} className="text-gray-400"/> Thương hiệu
              </h2>
              {expandedSections.brand ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
            </button>

            {expandedSections.brand && (
              <div className="space-y-4">
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input 
                    type="text" 
                    placeholder="Tìm theo tên" 
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                  />
                </div>
                
                <div className="space-y-3 pr-1">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-md border-2 border-gray-200 checked:bg-primary checked:border-primary transition-all cursor-pointer"
                      checked={selectedBrands.length === 0}
                      onChange={() => setSelectedBrands([])}
                    />
                    <span className={`text-xs font-bold ${selectedBrands.length === 0 ? 'text-primary' : 'text-gray-500 group-hover:text-gray-700'}`}>Tất cả</span>
                  </label>
                  
                  {uniqueBrands
                    .filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()))
                    .map(brand => (
                      <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded-md border-2 border-gray-200 checked:bg-primary checked:border-primary transition-all cursor-pointer"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => toggleFilter(selectedBrands, setSelectedBrands, brand)}
                        />
                        <span className={`text-xs font-bold transition-colors ${selectedBrands.includes(brand) ? 'text-primary' : 'text-gray-500 group-hover:text-gray-700'}`}>
                          {brand}
                        </span>
                      </label>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Nút Xóa bộ lọc */}
          {(selectedCategory !== 'Tất cả' || selectedSubCategory || selectedPriceRange !== 'all' || selectedCountries.length > 0 || selectedBrands.length > 0) && (
            <button 
              onClick={() => {
                setSelectedCategory('Tất cả');
                setSelectedSubCategory('');
                setSelectedPriceRange('all');
                setSelectedCountries([]);
                setSelectedBrands([]);
                setSearchTerm('');
              }}
              className="w-full py-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition flex items-center justify-center gap-2 mb-6"
            >
              <X size={14}/> Xóa tất cả bộ lọc
            </button>
          )}
        </aside>

        {/* Danh sách sản phẩm */}
        <div className="flex-1">
          
          {/* Header danh sách */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 w-full">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm thuốc, thực phẩm chức năng..." 
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="hidden sm:flex items-center text-sm font-bold text-gray-500 whitespace-nowrap bg-gray-50 px-5 py-3.5 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-primary mr-1.5 text-lg">{filteredProducts.length}</span> sản phẩm
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-[450px] border border-gray-100 shadow-sm"></div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-20 text-center shadow-sm">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={40} className="text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy sản phẩm</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-8">Rất tiếc, chúng tôi không tìm thấy sản phẩm nào khớp với bộ lọc của bạn.</p>
              <button 
                onClick={() => {
                  setSelectedCategory('Tất cả');
                  setSelectedSubCategory('');
                  setSelectedPriceRange('all');
                  setSelectedCountries([]);
                  setSelectedBrands([]);
                  setSearchTerm('');
                }}
                className="px-8 py-3.5 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-100 hover:scale-105 transition-transform"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            <>
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
                          onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x300?text=No+Image'; }}
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
                      <div className="mb-2 h-[4.5rem]">
                         <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">{product.sub_category || 'Sản phẩm'}</p>
                         <Link to={`/product/${product.id}`} className="hover:text-primary transition-colors" title={product.name}>
                          <h3 className="font-bold text-gray-800 text-base leading-tight break-words whitespace-normal line-clamp-2">{product.name}</h3>
                        </Link>
                      </div>
                      
                      <div className="h-[3.25rem] mb-5">
                        <p className="text-gray-500 text-[11px] leading-relaxed line-clamp-3">{product.description}</p>
                      </div>
                      
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

              {/* Chuyển trang căn giữa dưới danh sách sản phẩm */}
              {!loading && totalPages > 1 && (
                <div className="mt-16 flex flex-col items-center">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <button 
                      onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="px-8 py-3 rounded-2xl border-2 border-gray-100 bg-white hover:border-primary hover:text-primary font-black text-sm transition-all shadow-sm disabled:opacity-30 disabled:hover:border-gray-100 disabled:hover:text-gray-400 flex items-center gap-2"
                      disabled={page === 1}
                    >
                      ← <span className="hidden sm:inline">Trang trước</span>
                    </button>
                    
                    <div className="flex items-center gap-2">
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => { setPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className={`w-12 h-12 rounded-2xl text-sm font-black transition-all duration-300 flex items-center justify-center ${
                            page === i + 1 
                            ? 'bg-primary text-white shadow-xl shadow-blue-200 scale-110 z-10' 
                            : 'bg-white border-2 border-gray-50 text-gray-400 hover:border-gray-200 hover:text-gray-600'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="px-8 py-3 rounded-2xl border-2 border-gray-100 bg-white hover:border-primary hover:text-primary font-black text-sm transition-all shadow-sm disabled:opacity-30 disabled:hover:border-gray-100 disabled:hover:text-gray-400 flex items-center gap-2"
                      disabled={page === totalPages}
                    >
                      <span className="hidden sm:inline">Trang sau</span> →
                    </button>
                  </div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    Đang hiển thị trang {page} trong tổng số {totalPages} trang
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
