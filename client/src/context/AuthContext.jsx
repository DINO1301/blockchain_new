import { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../services/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // User object từ Firebase
  const [role, setRole] = useState(null); // 'admin' | 'user' | 'lab'
  const [loading, setLoading] = useState(true);

  // 1. Đăng ký tài khoản mới
  const register = async (email, password, fullName) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = res.user;
    await setDoc(doc(db, "users", newUser.uid), {
      email: email,
      fullName: fullName,
      role: 'user',
      createdAt: new Date().toISOString()
    });
    
    return newUser;
  };

  // 2. Đăng nhập
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // 3. Đăng xuất
  const logout = () => {
    
    return signOut(auth);
  };

  // 4. Theo dõi trạng thái đăng nhập (Tự động chạy khi F5 trang)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setLoading(true);
        if (currentUser) {
          // Bước 1: Luôn set user cơ bản từ Firebase Auth trước
          setUser(currentUser);
          
          try {
            // Bước 2: Thử lấy thêm Role từ Database
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            
            // --- CẤU HÌNH ADMIN MẶC ĐỊNH ---
            const ADMIN_EMAIL = "nguyenvietdunghp1997@gmail.com";
            const isHardcodedAdmin = currentUser.email === ADMIN_EMAIL;
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUser({ ...currentUser, ...userData });
              // Nếu là email admin đặc biệt thì luôn là admin, còn lại lấy từ DB
              setRole(isHardcodedAdmin ? 'admin' : userData.role); 
            } else {
              console.warn("User profile not found in Firestore for UID:", currentUser.uid);
              setUser(currentUser);
              // Nếu không tìm thấy profile nhưng đúng email admin thì vẫn cho làm admin
              setRole(isHardcodedAdmin ? 'admin' : 'user');
            }
          } catch (dbError) {
            console.error("Firestore Permission/Error:", dbError);
            // Lỗi database thì kiểm tra email để cứu cánh
            const ADMIN_EMAIL = "nguyenvietdunghp1997@gmail.com";
            setRole(currentUser.email === ADMIN_EMAIL ? 'admin' : 'user'); 
          }
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error("Global Auth Error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, login, register, logout, loading }}>
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