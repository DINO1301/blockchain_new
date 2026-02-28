import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Web3Context } from '../../context/Web3Context';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Shield, Wallet, User, Lock } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth(); // Thông tin từ Firebase
  const { currentAccount, connectWallet } = useContext(Web3Context); // Thông tin ví MetaMask
  
  const [loading, setLoading] = useState(false);
  const [linkedWallet, setLinkedWallet] = useState(user?.walletAddress || ''); // Ví đã lưu trong DB

  // Hàm Liên kết ví (Chỉ dành cho Admin/Lab)
  const handleBindWallet = async () => {
    if (!currentAccount) return alert("Vui lòng kết nối MetaMask trước!");
    
    const confirm = window.confirm(`Bạn có chắc muốn liên kết tài khoản này với ví ${currentAccount}? Hành động này không thể hoàn tác.`);
    if (!confirm) return;

    setLoading(true);
    try {
      // Cập nhật trường walletAddress vào Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        walletAddress: currentAccount
      });
      
      setLinkedWallet(currentAccount);
      alert("✅ Đã liên kết ví thành công! Từ giờ bạn chỉ có thể dùng ví này để thao tác.");
    } catch (error) {
      console.error(error);
      alert("Lỗi liên kết ví");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Hồ sơ cá nhân</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* CỘT 1: THÔNG TIN CƠ BẢN (Ai cũng thấy) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <User className="text-primary"/> Thông tin tài khoản
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500">Họ tên</label>
              <p className="font-medium text-lg">{user?.fullName || "Chưa cập nhật"}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-500">Email</label>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-500">Vai trò</label>
              <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-sm font-bold uppercase mt-1">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* CỘT 2: BẢO MẬT VÍ (Chỉ hiện cho Admin/Lab) */}
        {['admin', 'lab'].includes(user?.role) && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-200">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-orange-700">
              <Shield/> Bảo mật Blockchain
            </h2>
            
            <p className="text-sm text-gray-500 mb-6">
              Để đảm bảo an toàn, tài khoản quản trị cần được liên kết cố định với một địa chỉ ví.
            </p>

            {linkedWallet ? (
              // Trạng thái: Đã liên kết
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-green-800 text-sm font-bold flex items-center gap-2 mb-2">
                  <Lock size={16}/> Ví đã được bảo vệ
                </p>
                <p className="font-mono text-xs text-gray-600 break-all bg-white p-2 rounded border">
                  {linkedWallet}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  *Chỉ ví này mới có quyền thực hiện giao dịch dưới tên bạn.
                </p>
              </div>
            ) : (
              // Trạng thái: Chưa liên kết -> Cho phép liên kết
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
                  <Wallet size={20} className="text-gray-400"/>
                  <span className="font-mono text-sm text-gray-600 truncate">
                    {currentAccount || "Chưa kết nối MetaMask"}
                  </span>
                </div>

                {!currentAccount ? (
                  <button 
                    onClick={connectWallet}
                    className="w-full py-2 border border-primary text-primary rounded-lg hover:bg-blue-50"
                  >
                    Kết nối MetaMask
                  </button>
                ) : (
                  <button 
                    onClick={handleBindWallet}
                    disabled={loading}
                    className="w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold shadow"
                  >
                    {loading ? "Đang xử lý..." : "🔗 Liên kết ví này ngay"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;