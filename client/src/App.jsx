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
  const { user, logout } = useAuth(); // Lấy thông tin user từ Firebase
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Ngắt ví trước (Xóa state Web3)
      disconnectWallet(); 
      
      // Sau đó đăng xuất Firebase (Xóa state Web2)
      await logout();
      
      // Chuyển hướng
      navigate('/login');
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* HEADER WEB2 (Firebase Auth) */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">M</span>
            <span className="font-bold text-xl tracking-tight text-primary">MediTrack</span>
          </Link>
          {/* Navigation items */}
          <div className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-500 hover:text-gray-900 font-normal">Trang chủ</Link>
            <Link to="/shop" className="text-gray-500 hover:text-gray-900 font-normal">Shop</Link>
            <Link to="/tracking" className="text-gray-500 hover:text-gray-900 font-normal">Tra cứu</Link>
            <Link to="/orders" className="text-gray-500 hover:text-gray-900 font-normal">Đơn hàng</Link>
            {/* Chỉ hiện menu Admin nếu role là admin */}
            {user && user.role === "admin" && (
              <>
                <Link to="/admin/dashboard" className="text-gray-500 hover:text-gray-900 font-normal">Sản xuất</Link>
                <Link to="/admin/inventory" className="text-gray-500 hover:text-gray-900 font-normal">Kho hàng</Link>
                <Link to="/admin/qc" className="text-gray-500 hover:text-gray-900 font-normal">QC</Link>
                <Link to="/admin/products" className="text-gray-500 hover:text-indigo-600 font-normal">Sản phẩm</Link>
              </>
            )}
          </div>
          {/* User Section */}
          <div className="flex items-center gap-4">
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-primary transition">
              <ShoppingCart size={24} />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {totalItems}
                </span>
              )}
            </Link>
            {/* Nút Connect Wallet (Web3) - Để riêng một góc nhỏ */}
            {currentAccount ? (
               <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-mono border border-green-200">
                 Waitlet: {currentAccount.slice(0,4)}...{currentAccount.slice(-4)}
               </span>
            ) : (user ?
               <button onClick={connectWallet} className="text-xs text-primary hover:underline">
                 Liên kết Ví
               </button> : <></>
            )}

            {/* Khu vực User (Web2) */}
            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-800">{user.fullName || user.email}</p>
                  <p className="text-xs text-gray-500 uppercase">{user.role || 'User'}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded text-sm transition"
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

          <Route path="/admin/qc" element={
            <ProtectedRoute allowedRoles={['lab', 'admin']}>
              <QualityControl />
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
