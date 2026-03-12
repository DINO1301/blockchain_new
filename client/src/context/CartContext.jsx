import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate(); // Dùng để chuyển hướng nếu chưa login
  
  const [cartItems, setCartItems] = useState([]);
  const [loadingCart, setLoadingCart] = useState(false);

  // 1. Chỉ tải giỏ hàng KHI VÀ CHỈ KHI có User
  useEffect(() => {
    const loadCart = async () => {
      if (user) {
        setLoadingCart(true);
        try {
          const { data, error } = await supabase
            .from('carts')
            .select('items')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (error && error.code !== 'PGRST116') { // Giữ phòng hờ nhưng maybeSingle sẽ trả null thay vì lỗi
            throw error;
          }

          if (data && data.items) {
            setCartItems(data.items || []);
          } else {
            setCartItems([]); // User mới chưa có giỏ
          }
        } catch (error) {
          console.error("Lỗi tải giỏ hàng:", error);
        } finally {
          setLoadingCart(false);
        }
      } else {
        // Nếu không có user (hoặc vừa logout), xóa sạch giỏ hàng trong State
        setCartItems([]);
      }
    };

    loadCart();
  }, [user]);

  // Hàm nội bộ để lưu lên Cloud
  const saveToCloud = async (newItems) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('carts')
        .upsert({ 
          user_id: user.id, 
          items: newItems,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (error) throw error;
    } catch (error) {
      console.error("Lỗi lưu giỏ hàng:", error);
    }
  };

  // --- CÁC HÀM THAO TÁC (Đã thêm Check Login) ---

  const addToCart = (product, quantity = 1) => {
    // Chưa login thì điều hướng về trang đăng nhập
    if (!user) {
      navigate('/login');
      return; // Dừng hình, không thêm gì cả
    }

    // Logic thêm hàng (như cũ)
    let newItems;
    const existingItem = cartItems.find((item) => item.id === product.id);
    
    if (existingItem) {
      newItems = cartItems.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
      );
    } else {
      newItems = [...cartItems, { ...product, quantity: Math.max(1, quantity) }];
    }

    setCartItems(newItems);
    saveToCloud(newItems); // Lưu thẳng lên Cloud
  };

  const removeFromCart = (productId) => {
    if (!user) return;
    const newItems = cartItems.filter((item) => item.id !== productId);
    setCartItems(newItems);
    saveToCloud(newItems);
  };

  const updateQuantity = (productId, amount) => {
    if (!user) return;
    const newItems = cartItems.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + amount;
        if (newQty < 1) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setCartItems(newItems);
    saveToCloud(newItems);
  };

  const clearCart = () => {
    if (!user) return;
    setCartItems([]);
    saveToCloud([]);
  };

  // Tính toán
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      totalAmount,
      totalItems,
      loadingCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
