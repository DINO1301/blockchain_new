import { useState, useContext } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Web3Context } from './context/Web3Context';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';
import { ShoppingCart, Menu, X } from 'lucide-react'; // Bổ sung Menu và X

// Các pages
// PUBLIC
import Home from './pages/public/Home';
import Cart from './pages/user/Cart';
import Shop from './pages/public/Shop';
import Profile from './pages/user/Profile';
import Login from './pages/public/Login';
import Tracking from './pages/public/Tracking';
import OrderHistory from './pages/user/OrderHistory';
import Product from './pages/public/Product';

// PRIVATE (SPECIAL ACCESS)
import AdminDashboard from './pages/admin/AdminDashboard';
import QualityControl from './pages/admin/QualityControl';
import Inventory from './pages/admin/Inventory';
import ProductManager from './pages/admin/ProductManager';
import ProductList from './pages/admin/ProductList';
import Chatbot from './components/Chatbot';

// Component bảo vệ (Chỉ cho phép Admin truy cập)
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();
  
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
  
  if (!user) return <Login />; 
  
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-10 text-center">
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 max-w-md">
          <h2 className="text-red-600 font-bold text-xl mb-2">Truy cập bị từ chối</h2>
          <p className="text-gray-600 mb-4">Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên hoặc kiểm tra lại tài khoản.</p>
          <Link to="/" className="text-primary hover:underline font-medium">Quay lại trang chủ</Link>
        </div>
      </div>
    );
  }
  return children;
};

function App() {
  const { connectWallet, currentAccount, disconnectWallet } = useContext(Web3Context);
  const { user, role, logout } = useAuth();
  const { totalItems } = useCart();
  
  const navigate = useNavigate();
  const location = useLocation(); // Dùng useLocation để check active link an toàn hơn
  
  // State quản lý Menu Mobile
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      disconnectWallet(); 
      await logout();
      setIsMenuOpen(false); // Đóng menu khi logout
      navigate('/login');
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

  const navClass = (path) =>
    `nav-link ${location.pathname === path ? 'active-nav' : ''}`;

  // CSS class riêng cho các nút bấm trên mobile (To hơn, dễ bấm hơn)
  const mobileNavClass = (path) =>
    `block py-3 px-4 rounded-lg font-medium transition ${location.pathname === path ? 'bg-blue-50 text-primary' : 'text-gray-700 hover:bg-gray-50'}`;

  return (
    <div className="min-h-screen bg-brand-lightBlue font-sans text-brand-navy">
      
      {/* HEADER WEB2 (Supabase Auth) */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-blue-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="h-8 w-8 bg-primary rounded flex items-center justify-center text-white font-bold">M</span>
            <span className="font-heading font-extrabold text-xl tracking-tight text-primary">MediTrack</span>
          </Link>

          {/* Navigation items (DESKTOP) */}
          <div className="hidden lg:flex items-center gap-6 overflow-x-auto no-scrollbar py-2">
            <Link to="/" className={navClass('/')}>Trang chủ</Link>
            <Link to="/shop" className={navClass('/shop')}>Shop</Link>
            <Link to="/tracking" className={navClass('/tracking')}>Tra cứu</Link>
            <Link to="/orders" className={navClass('/orders')}>Đơn hàng</Link>
            
            {user && role === "admin" && (
              <div className="flex items-center gap-6 pl-6 border-l border-gray-200">
                <Link to="/admin/dashboard" className={navClass('/admin/dashboard')}>Sản xuất</Link>
                <Link to="/admin/inventory" className={navClass('/admin/inventory')}>Kho hàng</Link>
                <Link to="/admin/products" className={navClass('/admin/products')}>Sản phẩm</Link>
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4 shrink-0 ml-auto">
            {/* Giỏ hàng (Hiển thị cả Mobile & Desktop) */}
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-primary transition mr-1">
              <ShoppingCart size={22} />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Wallet Section (DESKTOP) */}
            <div className="hidden sm:block">
              {currentAccount ? (
                 <div className="hidden xl:flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full font-mono text-xs border border-green-100">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   {currentAccount.slice(0,6)}...{currentAccount.slice(-4)}
                 </div>
              ) : (user && (
                 <button onClick={connectWallet} className="text-xs font-bold text-primary hover:text-blue-700 hover:underline">
                   Liên kết Ví
                 </button>
              ))}
            </div>

            {/* User Auth Section (DESKTOP) */}
            <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-gray-200">
              {user ? (
                <>
                  <div className="text-right hidden xl:block leading-tight">
                    <p className="text-sm font-bold text-gray-800">{user.full_name}</p>
                    <div className="flex items-center gap-1 justify-end">
                      {role === 'admin' && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 rounded uppercase border border-emerald-100">
                          Admin on-chain
                        </span>
                      )}
                      <span className="text-[10px] text-gray-500 font-bold uppercase">{role || 'User'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="bg-gray-100/80 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold transition border border-gray-200"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <Link 
                  to="/login"
                  className="bg-primary hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition shadow-sm"
                >
                  Đăng nhập
                </Link>
              )}
            </div>

            {/* HAMBURGER BUTTON (MOBILE) */}
            <button 
              className="lg:hidden p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-md transition"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* MOBILE DROPDOWN MENU */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-16 left-0 w-full bg-white shadow-xl border-t border-gray-100 flex flex-col z-40 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="p-4 flex flex-col gap-1 border-b border-gray-100">
              <Link to="/" className={mobileNavClass('/')} onClick={closeMenu}>Trang chủ</Link>
              <Link to="/shop" className={mobileNavClass('/shop')} onClick={closeMenu}>Shop</Link>
              <Link to="/tracking" className={mobileNavClass('/tracking')} onClick={closeMenu}>Tra cứu</Link>
              <Link to="/orders" className={mobileNavClass('/orders')} onClick={closeMenu}>Đơn hàng</Link>
            </div>

            {/* Admin Links trên Mobile */}
            {user && role === "admin" && (
              <div className="p-4 flex flex-col gap-1 bg-gray-50 border-b border-gray-100">
                <p className="px-4 text-xs font-bold text-gray-400 uppercase mb-2">Quản trị viên</p>
                <Link to="/admin/dashboard" className={mobileNavClass('/admin/dashboard')} onClick={closeMenu}>Sản xuất</Link>
                <Link to="/admin/inventory" className={mobileNavClass('/admin/inventory')} onClick={closeMenu}>Kho hàng</Link>
                <Link to="/admin/products" className={mobileNavClass('/admin/products')} onClick={closeMenu}>Sản phẩm</Link>
              </div>
            )}

            {/* User Profile / Auth trên Mobile */}
            <div className="p-6 bg-white">
              {user ? (
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{user.full_name || user.email}</p>
                    <p className="text-xs text-gray-500 uppercase">{role || 'User'}</p>
                  </div>
                  
                  {/* Wallet Mobile */}
                  {!currentAccount ? (
                    <button onClick={() => { connectWallet(); closeMenu(); }} className="w-full text-center py-2 border-2 border-primary text-primary font-bold rounded-lg">
                      Liên kết Ví Web3
                    </button>
                  ) : (
                    <div className="w-full text-center py-2 bg-green-50 text-green-700 font-mono text-xs rounded-lg border border-green-100">
                      Ví: {currentAccount.slice(0,6)}...{currentAccount.slice(-4)}
                    </div>
                  )}

                  <button 
                    onClick={handleLogout}
                    className="w-full bg-red-50 text-red-600 hover:bg-red-100 py-3 rounded-lg font-bold transition mt-2"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login"
                  onClick={closeMenu}
                  className="block text-center w-full bg-primary text-white py-3 rounded-lg font-bold shadow-sm"
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="py-10">
        <Routes>
          {/* Các Route giữ nguyên như cũ... */}
          <Route path="/" element={<Home/>}/>
          <Route path="/shop" element={<Shop />} /> 
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/login" element={<Login />} />

          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/inventory" element={<ProtectedRoute allowedRoles={['admin', 'lab']}><Inventory /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute allowedRoles={['user', 'admin', 'lab']}><Profile /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute allowedRoles={['admin']}><ProductList /></ProtectedRoute>} />
          <Route path="/admin/products/new" element={<ProtectedRoute allowedRoles={['admin']}><ProductManager /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute allowedRoles={['user', 'admin', 'lab']}><Cart /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute allowedRoles={['user', 'admin', 'lab']}><OrderHistory /></ProtectedRoute>} />
        </Routes>
      </main>

      <Chatbot />
    </div>
  );
}

export default App;