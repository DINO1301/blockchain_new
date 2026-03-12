import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Loader2, Shield, User, TestTube2, Eye, EyeOff} from 'lucide-react';
import { supabase } from '../../services/supabase';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, resetPassword } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'user' // Mặc định là User
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setInfo('');

    try {
      if (isRegister) {
        await register(formData.email, formData.password, formData.fullName);
        navigate('/'); // Đăng ký xong về trang chủ
      } else {
        await login(formData.email, formData.password);
        // Sau khi login, không navigate ngay bằng formData.role vì role thực tế nằm trong Firestore
        // AuthContext sẽ tự động cập nhật và ProtectedRoute sẽ xử lý việc hiển thị.
        // Tuy nhiên để UX tốt, ta có thể về trang chủ trước.
        navigate('/');
      }

    } catch (err) {
      console.error(err);
      setError("Thất bại: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    setError('');
    setInfo('');
    if (!formData.email) {
      setError("Vui lòng nhập email để đặt lại mật khẩu");
      return;
    }
    try {
      setLoading(true);
      await resetPassword(formData.email);
      setInfo("Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.");
    } catch (err) {
      setError("Không thể gửi email: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Phát hiện link khôi phục (type=recovery) và chuẩn bị form đổi mật khẩu
  useEffect(() => {
    const hash = window.location.hash || window.location.search;
    if (!hash) return;
    const params = new URLSearchParams(hash.replace('#', '').replace('?', ''));
    if (params.get('type') === 'recovery') {
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      (async () => {
        try {
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
          }
          setResetMode(true);
          setInfo("Vui lòng nhập mật khẩu mới để hoàn tất.");
        } catch (e) {
          setError("Không thể khởi tạo phiên khôi phục: " + (e.message || 'Lỗi không xác định'));
        }
      })();
    }
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!newPass || newPass.length < 6) {
      setError("Mật khẩu mới phải tối thiểu 6 ký tự");
      return;
    }
    if (newPass !== confirmPass) {
      setError("Xác nhận mật khẩu không khớp");
      return;
    }
    try {
      setLoading(true);
      const { error: upErr } = await supabase.auth.updateUser({ password: newPass });
      if (upErr) throw upErr;
      setInfo("Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.");
      // Xoá hash để tránh lặp
      history.replaceState(null, '', window.location.pathname);
      setResetMode(false);
      setFormData({ ...formData, password: '' });
    } catch (err) {
      setError("Đặt lại mật khẩu thất bại: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row border border-gray-100">
        
        {/* Cột trái: Hình ảnh/Banner */}
        <div className="md:w-1/2 bg-primary p-10 text-white flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600 to-blue-900 opacity-50"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-4">MediTrack 2.0</h2>
            <p className="text-blue-100 text-lg mb-8">Hệ thống truy xuất nguồn gốc dược liệu minh bạch trên nền tảng Blockchain.</p>
            <ul className="space-y-4 text-sm opacity-90">
              <li className="flex gap-2"><Shield size={18}/> Bảo mật tuyệt đối</li>
              <li className="flex gap-2"><TestTube2 size={18}/> Kiểm định chất lượng nghiêm ngặt</li>
              <li className="flex gap-2"><User size={18}/> Dễ dàng sử dụng</li>
            </ul>
          </div>
        </div>

        {/* Cột phải: Form */}
        <div className="md:w-1/2 p-10 py-16">
          {!resetMode ? (
            <>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {isRegister ? 'Tạo tài khoản mới' : 'Chào mừng trở lại'}
              </h3>
              <p className="text-gray-500 mb-8 text-sm">
                {isRegister ? 'Điền thông tin bên dưới để bắt đầu' : 'Vui lòng đăng nhập để tiếp tục'}
              </p>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Đặt lại mật khẩu</h3>
              <p className="text-gray-500 mb-8 text-sm">Vui lòng nhập mật khẩu mới cho tài khoản của bạn</p>
            </>
          )}

          {!resetMode ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Tên hiển thị (Chỉ hiện khi Đăng ký) */}
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-lg border bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary outline-none transition"
                  placeholder="Nguyễn Văn A"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-lg border bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary outline-none transition"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <div className="relative"> {/* 1. Wrapper phải là relative */}
                <input
                  type={showPassword ? "text" : "password"} // 2. Đổi type dựa theo state
                  required
                  className="w-full px-4 py-3 rounded-lg border bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary outline-none transition pr-10" // 3. Thêm pr-10 để chữ không bị đè lên icon
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                
                {/* 4. Nút bấm Icon nằm đè lên input */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    <Eye size={20} /> // Icon khi đang hiện pass (bấm để ẩn)
                  ) : (
                    <EyeOff size={20} />    // Icon khi đang ẩn pass (bấm để hiện)
                  )}
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin"/> : (isRegister ? 'Đăng ký' : 'Đăng nhập')}
            </button>
            {!isRegister && (
              <button
                type="button"
                onClick={handleForgot}
                disabled={loading}
                className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-lg transition"
              >
                Quên mật khẩu?
              </button>
            )}
          </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-lg border bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary outline-none transition"
                  placeholder="••••••••"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-lg border bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary outline-none transition"
                  placeholder="••••••••"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {info && <p className="text-green-600 text-sm">{info}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin"/> : 'Cập nhật mật khẩu'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            {info && <p className="text-green-600 mb-2">{info}</p>}
            <p className="text-gray-600">
              {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
              <button 
                onClick={() => setIsRegister(!isRegister)}
                className="text-primary font-bold ml-1 hover:underline"
              >
                {isRegister ? 'Đăng nhập ngay' : 'Tạo tài khoản mới'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
