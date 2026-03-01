import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // User object từ Supabase Auth
  const [role, setRole] = useState(null); // 'admin' | 'user' | 'lab'
  const [loading, setLoading] = useState(true);

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
    // Lấy session hiện tại khi khởi tạo
    const initAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await handleUserSession(session.user);
      } else {
        setLoading(false);
      }
    };

    initAuth();

    // Lắng nghe thay đổi auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await handleUserSession(session.user);
      } else {
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
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

    try {
      // Tải Role chạy ngầm
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      const ADMIN_EMAIL = "nguyenhieu@gmail.com";
      const isHardcodedAdmin = authUser.email === ADMIN_EMAIL;
      
      if (!dbError && userData) {
        setUser({ ...authUser, ...userData });
        setRole(isHardcodedAdmin ? 'admin' : userData.role); 
      } else {
        setRole(isHardcodedAdmin ? 'admin' : 'user');
      }
    } catch (error) {
      console.error("Auth Error:", error);
    } finally {
      // Chỉ tắt loading sau khi đã cố gắng lấy Role
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
