import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, Search, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();

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
        console.error("Lỗi tải shop:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6">
      
      {/* Banner Quảng Cáo */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 mb-8 text-white flex flex-col md:flex-row items-center justify-between shadow-lg">
        <div>
          <h1 className="text-3xl font-bold mb-2">Nhà Thuốc Chính Hãng MediTrack</h1>
          <p className="text-blue-100 opacity-90">Cam kết thuốc thật 100% - Truy xuất nguồn gốc bằng Blockchain</p>
        </div>
        <div className="mt-4 md:mt-0 bg-white/20 p-3 rounded-lg backdrop-blur-sm">
           <Filter className="inline-block mr-2"/> Lọc theo danh mục
        </div>
      </div>

      {/* Grid Sản Phẩm */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Đang tải thuốc...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition overflow-hidden flex flex-col group cursor-pointer"
              onClick={(e) => {
                if ((e.target.closest('button'))) return;
                navigate(`/product/${product.id}`);
              }}
            >
              
              {/* Ảnh sản phẩm */}
              <div className="h-48 bg-gray-50 overflow-hidden relative">
                <Link to={`/product/${product.id}`}>
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>
                {/* Badge tồn kho */}
                <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 text-xs font-bold rounded shadow-sm text-gray-600">
                  Còn: {product.total_stock || 0}
                </div>
              </div>

              {/* Thông tin */}
              <div className="p-4 flex-1 flex flex-col">
                <Link to={`/product/${product.id}`} className="hover:text-primary">
                  <h3 className="font-bold text-gray-800 text-lg mb-1 line-clamp-1">{product.name}</h3>
                </Link>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">{product.description}</p>
                
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-primary font-bold text-xl">
                    {product.price?.toLocaleString()} ₫
                  </span>
                  
                  {product.total_stock > 0 ? (
                    <button 
                      onClick={() => addToCart(product)}
                      className="bg-primary hover:bg-blue-700 text-white p-2 rounded-lg transition shadow-sm active:scale-95"
                    >
                      <ShoppingCart size={20} />
                    </button>
                  ) : (
                    <span className="text-red-500 text-sm font-bold bg-red-50 px-2 py-1 rounded">Hết hàng</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Shop;
