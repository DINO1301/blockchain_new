import { useContext } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Web3Context } from './context/Web3Context';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';
import { ShoppingCart } from 'lucide-react';

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
  const { connectWallet, currentAccount, disconnectWallet } = useContext(Web3Context); // Vẫn giữ Web3 để dùng khi cần
  const { user, role, logout } = useAuth(); // Lấy thông tin user từ Supabase
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const ADMIN_EMAIL = 'nguyenhieu@gmail.com';

  const handleLogout = async () => {
    try {
      // Ngắt ví trước (Xóa state Web3)
      disconnectWallet(); 
      
      // Sau đó đăng xuất Supabase (Xóa state Web2)
      await logout();
      
      // Chuyển hướng
      navigate('/login');
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  const navClass = (path) =>
    `nav-link ${location.pathname === path ? 'active-nav' : ''}`;

  return (
    <div className="min-h-screen bg-brand-lightBlue font-sans text-brand-navy">
      
      {/* HEADER WEB2 (Supabase Auth) */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-blue-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="h-8 w-8 bg-primary rounded flex items-center justify-center text-white font-bold">M</span>
            <span className="font-heading font-extrabold text-xl tracking-tight text-primary">MediTrack</span>
          </Link>

          {/* Navigation items - Sửa lại để nằm trên 1 dòng */}
          <div className="hidden lg:flex items-center gap-6 overflow-x-auto no-scrollbar py-2">
            <Link to="/" className={navClass('/')}>Trang chủ</Link>
            <Link to="/shop" className={navClass('/shop')}>Shop</Link>
            <Link to="/tracking" className={navClass('/tracking')}>Tra cứu</Link>
            <Link to="/orders" className={navClass('/orders')}>Đơn hàng</Link>
            
            {/* Menu Admin */}
            {user && role === "admin" && (
              <div className="flex items-center gap-6 pl-6 border-l border-gray-200">
                <Link to="/admin/dashboard" className={navClass('/admin/dashboard')}>Sản xuất</Link>
                <Link to="/admin/inventory" className={navClass('/admin/inventory')}>Kho hàng</Link>
                <Link to="/admin/products" className={navClass('/admin/products')}>Sản phẩm</Link>
              </div>
            )}
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4 shrink-0 ml-auto">
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-primary transition">
              <ShoppingCart size={22} />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Wallet Section */}
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

            {/* User Auth Section */}
            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right hidden xl:block leading-tight">
                  <p className="text-sm font-bold text-gray-800">{user.full_name || user.email}</p>
                  <div className="flex items-center gap-1 justify-end">
                    {user.email === ADMIN_EMAIL && (
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
              </div>
            ) : (
              <Link 
                to="/login"
                className="bg-primary hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition shadow-sm"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="py-10">
        <Routes>
          {/* Trang công khai */}
          <Route path="/" element={<Home/>}/>
          <Route path="/shop" element={<Shop />} /> {/* Trang chủ tạm để là Tracking */}
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/login" element={<Login />} />

          {/* Trang Bảo vệ (Cần Login + Role Admin) */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/inventory" element={
            <ProtectedRoute allowedRoles={['admin', 'lab']}>
              <Inventory />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['user', 'admin', 'lab']}>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/admin/products" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ProductList />
            </ProtectedRoute>
          } />
          <Route path="/admin/products/new" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ProductManager />
            </ProtectedRoute>
          } />
          <Route path="/cart" element={
            <ProtectedRoute allowedRoles={['user', 'admin', 'lab']}>
              <Cart />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute allowedRoles={['user', 'admin', 'lab']}>
              <OrderHistory />
            </ProtectedRoute>
          } />
        </Routes>
      </main>

      {/* Chatbot thông minh */}
      <Chatbot />
    </div>
  );
}

export default App;
