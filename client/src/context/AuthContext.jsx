import { createContext, useState, useEffect, useContext, useRef } from 'react';
import { supabase } from '../services/supabase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // User object từ Supabase Auth
  const [role, setRole] = useState(null); // 'admin' | 'user' | 'lab'
  const [loading, setLoading] = useState(true);
  
  // Dùng ref để kiểm soát việc nạp Role (tránh nạp lặp lại gây lỗi Lock)
  const currentSessionUserId = useRef(null);

  // 1. Đăng ký tài khoản mới
  const register = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) throw error;
    
    // Tạo profile trong bảng users (nếu RLS cho phép hoặc dùng trigger bên Supabase)
    // Thông thường Supabase dùng Trigger để tự động copy user sang public.users
    // Nhưng nếu chưa có trigger, ta có thể insert thủ công:
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: data.user.id,
        email: email,
        full_name: fullName,
        role: 'user',
        created_at: new Date().toISOString()
      }]);
    
    if (profileError) console.error("Lỗi tạo profile:", profileError);
    
    return data.user;
  };

  // 2. Đăng nhập
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.user;
  };

  // 3. Đăng xuất
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setRole(null);
  };

  // 3.1. Quên mật khẩu (Gửi email đặt lại)
  const resetPassword = async (email) => {
    if (!email) throw new Error("Vui lòng nhập email");
    const redirectTo = `${window.location.origin}/login`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    return true;
  };

  // 4. Theo dõi trạng thái đăng nhập
  useEffect(() => {
    let mounted = true;

    // Bộ đếm an toàn: Nếu sau 3s không có phản hồi từ Auth, tắt spinner ngay
    const globalTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("⚠️ Quá 3s không nhận được tín hiệu Auth, tự động mở web.");
        setLoading(false);
      }
    }, 3000);

    // Lắng nghe thay đổi auth (Supabase tự động gọi khi khởi tạo - không cần getSession riêng)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log("Auth Event:", event);
      clearTimeout(globalTimeout); // Có tín hiệu là xóa bộ đếm an toàn ngay
      
      if (session) {
        // Chỉ nạp Role nếu là User mới hoặc sự kiện SIGNED_IN thực sự
        if (currentSessionUserId.current !== session.user.id || event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          currentSessionUserId.current = session.user.id;
          await handleUserSession(session.user);
        }
      } else {
        currentSessionUserId.current = null;
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(globalTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const handleUserSession = async (authUser) => {
    if (!authUser) {
      setLoading(false);
      return;
    }

    // Set user ngay lập tức để Header hiện tên/email, không bắt chờ DB
    setUser(authUser);
    console.log("Đang lấy thông tin role cho user:", authUser.id);

    // Safety timeout: Nếu lấy role quá 5s thì bỏ qua, cho vào web luôn
    const roleTimeout = setTimeout(() => {
      console.warn("⚠️ Hết thời gian chờ lấy Role (5s), ép buộc tắt loading.");
      setRole(authUser.email === "nguyenhieu@gmail.com" ? 'admin' : 'user');
      setLoading(false);
    }, 5000);

    try {
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      clearTimeout(roleTimeout);
      const ADMIN_EMAIL = "nguyenhieu@gmail.com";
      const isHardcodedAdmin = authUser.email === ADMIN_EMAIL;
      
      if (!dbError && userData) {
        console.log("✅ Đã lấy xong Role:", userData.role);
        setUser({ ...authUser, ...userData });
        setRole(isHardcodedAdmin ? 'admin' : userData.role); 
      } else {
        console.warn("ℹ️ Không tìm thấy profile trong bảng users, dùng mặc định.");
        setRole(isHardcodedAdmin ? 'admin' : 'user');
      }
    } catch (error) {
      console.error("❌ Lỗi nạp Role:", error);
    } finally {
      clearTimeout(roleTimeout);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, login, register, logout, resetPassword, loading }}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

// Hook custom để dùng nhanh
export const useAuth = () => useContext(AuthContext);
