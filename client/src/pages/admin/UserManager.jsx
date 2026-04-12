import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
  User, Mail, Shield, Calendar, Trash2, Edit3, Search, 
  Loader2, CheckCircle, XCircle, UserPlus, Filter, MoreVertical,
  ChevronLeft, ChevronRight, ShieldCheck, ShieldAlert
} from 'lucide-react';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'user'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Lỗi lấy danh sách người dùng:", error);
      alert("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email || '',
      full_name: user.full_name || '',
      role: user.role || 'user'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id, fullName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${fullName}"? Hành động này không thể hoàn tác.`)) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setUsers(users.filter(u => u.id !== id));
      alert("Đã xóa người dùng thành công");
    } catch (error) {
      console.error("Lỗi xóa người dùng:", error);
      alert("Lỗi khi xóa: " + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingUser) {
        // Cập nhật profile
        const { error } = await supabase
          .from('users')
          .update({
            full_name: formData.full_name,
            role: formData.role
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        alert("Cập nhật thông tin thành công");
      } else {
        // Chức năng thêm mới người dùng (Cần Admin Auth - Demo đơn giản qua profiles)
        alert("Tính năng thêm mới yêu cầu quyền Admin Auth chuyên sâu. Vui lòng sử dụng chức năng Đăng ký bên ngoài.");
      }
      
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Lỗi lưu người dùng:", error);
      alert("Lỗi: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <User className="text-primary" size={32} />
            Quản Lý Tài Khoản
          </h1>
          <p className="text-gray-500 font-medium mt-1">Quản lý phân quyền và thông tin người dùng hệ thống</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={18} className="text-gray-400 hidden sm:block" />
          <select 
            className="flex-1 md:w-48 px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">Tất cả vai trò</option>
            <option value="user">Khách hàng (User)</option>
            <option value="admin">Quản trị (Admin)</option>
          </select>
        </div>
        <button 
          onClick={fetchUsers}
          className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors"
          title="Làm mới"
        >
          <Loader2 size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Người dùng</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Vai trò</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Ngày tham gia</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-primary" size={40} />
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                        <User size={32} />
                      </div>
                      <p className="text-sm font-bold text-gray-400">Không tìm thấy người dùng nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center text-gray-500 font-black text-lg border border-white shadow-sm">
                          {u.full_name?.charAt(0).toUpperCase() || <User size={20} />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 leading-tight">{u.full_name || 'Chưa đặt tên'}</p>
                          <div className="flex items-center gap-1.5 text-gray-500 mt-0.5">
                            <Mail size={12} />
                            <span className="text-xs font-medium">{u.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          u.role === 'admin' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                          {u.role === 'admin' ? <ShieldCheck size={12} /> : <User size={12} />}
                          {u.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar size={14} />
                        <span className="text-xs font-medium">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '---'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(u)}
                          className="p-2 hover:bg-blue-50 text-gray-400 hover:text-primary rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(u.id, u.full_name)}
                          className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Edit3 size={24} className="text-primary" />
                Sửa Thành Viên
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-400">
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Email (Không thể sửa)</label>
                <div className="px-4 py-3 bg-gray-100 text-gray-500 rounded-xl text-sm font-medium border border-gray-200 flex items-center gap-3">
                   <Mail size={16} />
                   {formData.email}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Họ và tên</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Vai trò hệ thống</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'user'})}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-bold text-sm ${
                      formData.role === 'user' ? 'border-primary bg-blue-50 text-primary' : 'border-gray-100 bg-white text-gray-400'
                    }`}
                  >
                    <User size={18} />
                    User
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'admin'})}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-bold text-sm ${
                      formData.role === 'admin' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-gray-100 bg-white text-gray-400'
                    }`}
                  >
                    <Shield size={18} />
                    Admin
                  </button>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-95"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
