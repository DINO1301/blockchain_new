import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import {
  FileCheck,
  Plus,
  Save,
  Loader2,
  User,
  MapPin,
  Wallet,
  Edit2,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ClipboardList,
  Truck,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Package,
  MoreHorizontal,
  Trash2
} from 'lucide-react';

const PreBlockchainReview = () => {
  const { user, role } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(null);
  const [showEditStepModal, setShowEditStepModal] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [expandedReviewId, setExpandedReviewId] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCreatedBy, setFilterCreatedBy] = useState('all');
  const [rejectReason, setRejectReason] = useState('');

  const [formData, setFormData] = useState({
    batch_code: '',
    created_by_name: '',
    owner_name: '',
    wallet_address: '',
    address: '',
    notes: ''
  });

  const [transferFormData, setTransferFormData] = useState({
    to_name: '',
    to_address: '',
    to_wallet: '',
    notes: ''
  });

  const [editStepFormData, setEditStepFormData] = useState({
    owner_name: '',
    wallet_address: '',
    address: '',
    notes: ''
  });

  const isMainAdmin = role === 'admin_on_chain';

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pre_blockchain_reviews')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Lỗi tải danh sách kiểm duyệt:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.batch_code || !formData.owner_name || !formData.wallet_address) {
      alert('Vui lòng nhập đủ thông tin bắt buộc!');
      return;
    }

    try {
      if (editingReview) {
        const { error } = await supabase
          .from('pre_blockchain_reviews')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
            created_by_name: formData.created_by_name,
            original_owner_name: formData.owner_name,
            original_wallet_address: formData.wallet_address,
            original_address: formData.address
          })
          .eq('id', editingReview.id);
          
        if (error) throw error;
        alert('✅ Cập nhật thành công!');
      } else {
        const { error } = await supabase
          .from('pre_blockchain_reviews')
          .insert([{
            ...formData,
            original_owner_name: formData.owner_name,
            original_wallet_address: formData.wallet_address,
            original_address: formData.address,
            status: 'pending',
            transfer_history: [],
            created_by: user?.id,
            created_by_name: formData.created_by_name
          }]);
          
        if (error) throw error;
        alert('✅ Tạo phiếu kiểm duyệt thành công!');
      }
      
      setShowModal(false);
      setEditingReview(null);
      setFormData({ batch_code: '', owner_name: '', wallet_address: '', address: '', notes: '' });
      fetchReviews();
    } catch (error) {
      console.error('Lỗi:', error);
      alert('❌ Lỗi: ' + error.message);
    }
  };

  const handleTransfer = async (e, reviewId) => {
    e.preventDefault();
    if (!transferFormData.to_name || !transferFormData.to_address || !transferFormData.to_wallet) {
      alert('Vui lòng nhập đủ thông tin!');
      return;
    }

    try {
      const review = reviews.find(r => r.id === reviewId);
      const currentHistory = review.transfer_history || [];
      
      const newTransfer = {
        id: Date.now(),
        from_name: review.owner_name,
        from_address: review.address || '',
        from_wallet: review.wallet_address,
        to_name: transferFormData.to_name,
        to_address: transferFormData.to_address,
        to_wallet: transferFormData.to_wallet,
        notes: transferFormData.notes,
        transferred_by: user?.id,
        transferred_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('pre_blockchain_reviews')
        .update({
          transfer_history: [...currentHistory, newTransfer],
          owner_name: transferFormData.to_name,
          address: transferFormData.to_address,
          wallet_address: transferFormData.to_wallet,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);
      
      if (error) throw error;
      alert('✅ Chuyển phiếu thành công!');
      setShowTransferModal(null);
      setTransferFormData({ to_name: '', to_address: '', to_wallet: '' });
      fetchReviews();
    } catch (error) {
      console.error('Lỗi chuyển phiếu:', error);
      alert('❌ Lỗi: ' + error.message);
    }
  };

  const handleEditStep = async (e, reviewId, stepIndex) => {
    e.preventDefault();
    try {
      const review = reviews.find(r => r.id === reviewId);
      
      if (stepIndex === -1) {
        // Edit initial step
        const { error } = await supabase
          .from('pre_blockchain_reviews')
          .update({
            owner_name: editStepFormData.owner_name,
            wallet_address: editStepFormData.wallet_address,
            address: editStepFormData.address,
            notes: editStepFormData.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', reviewId);
        if (error) throw error;
      } else {
        // Edit transfer step
        const updatedHistory = [...(review.transfer_history || [])];
        updatedHistory[stepIndex] = {
          ...updatedHistory[stepIndex],
          to_name: editStepFormData.owner_name,
          to_wallet: editStepFormData.wallet_address,
          to_address: editStepFormData.address,
          notes: editStepFormData.notes
        };
        
        // Also update current owner if it's the last step
        let updateData = {
          transfer_history: updatedHistory,
          updated_at: new Date().toISOString()
        };
        
        if (stepIndex === updatedHistory.length - 1) {
          updateData.owner_name = editStepFormData.owner_name;
          updateData.wallet_address = editStepFormData.wallet_address;
          updateData.address = editStepFormData.address;
        }
        
        const { error } = await supabase
          .from('pre_blockchain_reviews')
          .update(updateData)
          .eq('id', reviewId);
        if (error) throw error;
      }
      
      alert('✅ Cập nhật giai đoạn thành công!');
      setShowEditStepModal(null);
      fetchReviews();
    } catch (error) {
      console.error('Lỗi cập nhật:', error);
      alert('❌ Lỗi: ' + error.message);
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review);
    setFormData({
      batch_code: review.batch_code,
      created_by_name: review.created_by_name || '',
      owner_name: review.owner_name,
      wallet_address: review.wallet_address,
      address: review.address || '',
      notes: review.notes || ''
    });
    setShowModal(true);
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Xác nhận duyệt phiếu này?')) return;
    try {
      const { error } = await supabase
        .from('pre_blockchain_reviews')
        .update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: user?.id })
        .eq('id', id);
      
      if (error) throw error;
      alert('✅ Đã duyệt!');
      fetchReviews();
    } catch (error) {
      console.error('Lỗi duyệt:', error);
      alert('❌ Lỗi duyệt: ' + error.message);
    }
  };

  const handleConfirmReject = async () => {
    if (!showRejectModal) return;
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lí do từ chối!');
      return;
    }
    try {
      const { error } = await supabase
        .from('pre_blockchain_reviews')
        .update({ 
          status: 'rejected', 
          reject_reason: rejectReason,
          rejected_at: new Date().toISOString(), 
          rejected_by: user?.id 
        })
        .eq('id', showRejectModal.id);
      
      if (error) throw error;
      alert('✅ Đã từ chối!');
      setShowRejectModal(null);
      setRejectReason('');
      fetchReviews();
    } catch (error) {
      console.error('Lỗi từ chối:', error);
      alert('❌ Lỗi từ chối: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa phiếu này? Hành động này không thể hoàn tác!')) return;
    try {
      const { error } = await supabase
        .from('pre_blockchain_reviews')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      alert('✅ Đã xóa phiếu!');
      fetchReviews();
    } catch (error) {
      console.error('Lỗi xóa phiếu:', error);
      alert('❌ Lỗi xóa: ' + error.message);
    }
  };

  const handleDeleteStep = async (reviewId, stepIndex) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa giai đoạn này?')) return;
    try {
      const review = reviews.find(r => r.id === reviewId);
      const updatedHistory = [...(review.transfer_history || [])];
      
      // Remove the step
      updatedHistory.splice(stepIndex, 1);
      
      // Update current owner if needed
      let updateData = {
        transfer_history: updatedHistory,
        updated_at: new Date().toISOString()
      };
      
      // If we deleted the last step, revert owner info to the previous one
      if (updatedHistory.length > 0) {
        const lastStep = updatedHistory[updatedHistory.length - 1];
        updateData.owner_name = lastStep.to_name;
        updateData.wallet_address = lastStep.to_wallet;
        updateData.address = lastStep.to_address;
      } else {
        // If no more transfer steps, use initial info
        // We need to keep track of initial info, but since we don't have it, let's just keep current or handle differently
      }
      
      const { error } = await supabase
        .from('pre_blockchain_reviews')
        .update(updateData)
        .eq('id', reviewId);
      
      if (error) throw error;
      alert('✅ Đã xóa giai đoạn!');
      fetchReviews();
    } catch (error) {
      console.error('Lỗi xóa giai đoạn:', error);
      alert('❌ Lỗi xóa: ' + error.message);
    }
  };

  const uniqueCreatedByNames = isMainAdmin 
    ? [...new Set(reviews.map(r => r.created_by_name).filter(Boolean))]
    : [user?.full_name || user?.email || ''];

  const filteredReviews = reviews.filter(review => {

    // Only show own reviews for non-main-admins
    const matchesOwnership = isMainAdmin || review.created_by === user?.id;
    
    const matchesSearch = 
      searchTerm.trim() === '' ||
      review.batch_code?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.created_by_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || review.status === filterStatus;
    
    const matchesCreatedBy = filterCreatedBy === 'all' || review.created_by_name === filterCreatedBy;
    
    return matchesOwnership && matchesSearch && matchesStatus && matchesCreatedBy;
  });

  const getSteps = (review) => {
    const steps = [];
    
    // Initial step - always use original info
    steps.push({
      id: 'initial',
      name: review.original_owner_name || review.owner_name,
      wallet: review.original_wallet_address || review.wallet_address,
      address: review.original_address || review.address,
      notes: review.notes,
      timestamp: review.created_at,
      isInitial: true
    });
    
    // Transfer steps
    (review.transfer_history || []).forEach((transfer, idx) => {
      steps.push({
        id: transfer.id,
        name: transfer.to_name,
        wallet: transfer.to_wallet,
        address: transfer.to_address,
        notes: transfer.notes,
        from_name: transfer.from_name,
        timestamp: transfer.transferred_at,
        isInitial: false,
        stepIndex: idx
      });
    });
    
    return steps;
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <FileCheck size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Kiểm Duyệt Trước Blockchain</h1>
            <p className="text-sm text-gray-500">Quản lý phiếu kiểm duyệt trước khi đưa lên blockchain</p>
          </div>
        </div>
        <button
          onClick={() => { setEditingReview(null); setFormData({ batch_code: '', created_by_name: '', owner_name: '', wallet_address: '', address: '', notes: '' }); setShowModal(true); }}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl font-bold transition shadow-lg shadow-purple-100"
        >
          <Plus size={20} /> Tạo phiếu mới
        </button>
      </div>

      <div className="glass-card bg-white/60 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/30 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã lô, tên người sở hữu, hoặc người tạo..."
              className="w-full pl-12 pr-4 py-3.5 bg-white/60 border border-white/40 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition text-base font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={18} className="text-gray-400" />
            <select
              className="flex-1 md:w-auto px-4 py-3.5 bg-white/60 border border-white/40 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-bold"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chưa duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Đã từ chối</option>
            </select>
          </div>
          {uniqueCreatedByNames.length > 0 && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <User size={18} className="text-gray-400" />
              <select
                className="flex-1 md:w-auto px-4 py-3.5 bg-white/60 border border-white/40 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-bold"
                value={filterCreatedBy}
                onChange={(e) => setFilterCreatedBy(e.target.value)}
              >
                <option value="all">Tất cả người tạo</option>
                {uniqueCreatedByNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <Loader2 className="animate-spin mx-auto text-purple-600" size={40} />
          <p className="text-gray-500 mt-4">Đang tải dữ liệu...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-20 text-center border-2 border-dashed border-gray-200">
          <ClipboardList className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-xl font-bold text-gray-700 mb-2">Chưa có phiếu nào</h3>
          <p className="text-gray-500">Tạo phiếu kiểm duyệt đầu tiên của bạn</p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredReviews.map((review) => {
            const steps = getSteps(review);
            const isExpanded = expandedReviewId === review.id;
            
            return (
              <div key={review.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Review Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`px-5 py-3 rounded-2xl font-bold text-sm shadow-lg ${
                        review.status === 'approved' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                        review.status === 'rejected' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white' :
                        'bg-gradient-to-r from-yellow-400 to-amber-500 text-white'
                      }`}>
                        {review.status === 'approved' ? 'Đã duyệt' :
                         review.status === 'rejected' ? 'Đã từ chối' :
                         'Chưa duyệt'}
                      </div>
                      <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl font-bold font-mono">
                        Lô: #{review.batch_code}
                      </div>
                      {review.transfer_history && review.transfer_history.length > 0 && (
                        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                          <Truck size={14} />
                          {review.transfer_history.length} lần chuyển
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedReviewId(isExpanded ? null : review.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                      </button>
                    </div>
                  </div>
                  {/* Original Owner Info - Always Fixed */}
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="text-xs font-bold uppercase tracking-wider text-green-700 mb-2 flex items-center gap-2">
                      <Package size={16} /> Người sở hữu ban đầu (không thay đổi)
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-green-600 font-medium mb-1">Tên</p>
                        <p className="font-bold text-green-900">{review.original_owner_name || review.owner_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600 font-medium mb-1">Địa chỉ ví</p>
                        <p className="font-mono text-sm text-green-800 break-all">{review.original_wallet_address || review.wallet_address}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600 font-medium mb-1">Địa chỉ</p>
                        <p className="text-green-800">{review.original_address || review.address || '—'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Created By Info */}
                  {review.created_by_name && (
                    <div className="mt-3 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                      <div className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-2 flex items-center gap-2">
                        <User size={16} /> Người tạo phiếu
                      </div>
                      <p className="font-bold text-purple-900">{review.created_by_name}</p>
                    </div>
                  )}

                  {/* Reject Reason Display (Always Visible) */}
                  {review.status === 'rejected' && review.reject_reason && (
                    <div className="mt-3 p-5 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 rounded-2xl shadow-lg">
                      <div className="text-xs font-black uppercase tracking-wider text-red-700 mb-3 flex items-center gap-2">
                        <XCircle size={20} className="text-red-600" /> Lí do từ chối
                      </div>
                      <p className="font-bold text-gray-900 text-base">{review.reject_reason}</p>
                    </div>
                  )}
                </div>

                {/* Review Content - Timeline */}
                {isExpanded && (
                  <div className="p-6">
                    <div className="relative">
                      {/* Timeline steps */}
                      {steps.map((step, stepIdx) => (
                        <div key={step.id} className="flex gap-6 mb-8 last:mb-0">
                          {/* Timeline dot and line */}
                          <div className="flex flex-col items-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-10 ${
                              stepIdx === 0 ? 'bg-blue-600 text-white' : 'bg-white border-4 border-blue-200 text-blue-600'
                            }`}>
                              {stepIdx === 0 ? <Package size={20} /> : stepIdx + 1}
                            </div>
                            {stepIdx < steps.length - 1 && (
                              <div className="w-1 flex-1 bg-blue-200 mt-2" />
                            )}
                          </div>
                          
                          {/* Step content */}
                          <div className="flex-1 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                              <div className="flex-1 space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                                      <User size={14} /> Người sở hữu
                                    </div>
                                    <p className="font-bold text-lg text-gray-800">{step.name}</p>
                                  </div>
                                  
                                  <div>
                                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                                      <Wallet size={14} /> Địa chỉ ví
                                    </div>
                                    <p className="font-mono text-sm text-gray-700 break-all">{step.wallet}</p>
                                  </div>
                                </div>
                                
                                {step.address && (
                                  <div>
                                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                                      <MapPin size={14} /> Địa chỉ
                                    </div>
                                    <p className="text-gray-700">{step.address}</p>
                                  </div>
                                )}
                                
                                {step.notes && (
                                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                    <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">Ghi chú</div>
                                    <p className="font-bold text-gray-800">{step.notes}</p>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <Clock size={12} />
                                  {new Date(step.timestamp).toLocaleString('vi-VN')}
                                </div>
                              </div>
                              
                              {review.status === 'pending' && (
                                <div className="flex flex-col gap-2">
                                  <button
                                    onClick={() => {
                                      setShowEditStepModal({
                                        review,
                                        stepIndex: step.isInitial ? -1 : step.stepIndex
                                      });
                                      setEditStepFormData({
                                        owner_name: step.name,
                                        wallet_address: step.wallet,
                                        address: step.address || '',
                                        notes: step.notes || ''
                                      });
                                    }}
                                    className="p-3 bg-white border border-gray-200 text-blue-600 rounded-xl hover:bg-blue-50 transition"
                                    title="Sửa giai đoạn này"
                                  >
                                    <Edit2 size={18} />
                                  </button>
                                  
                                  {!step.isInitial && (
                                    <button
                                      onClick={() => handleDeleteStep(review.id, step.stepIndex)}
                                      className="p-3 bg-white border border-gray-200 text-red-600 rounded-xl hover:bg-red-50 transition"
                                      title="Xóa giai đoạn này"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    

                    
                    {/* Action buttons */}
                    <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-3">
                      {review.status === 'pending' && (
                        <>
                          <button
                            onClick={() => setShowTransferModal(review)}
                            className="flex items-center gap-2 px-6 py-3 bg-orange-50 text-orange-700 rounded-xl font-bold hover:bg-orange-100 transition"
                          >
                            <Truck size={18} /> Chuyển phiếu
                          </button>
                          
                          {isMainAdmin && (
                            <>
                              <button
                                onClick={() => handleApprove(review.id)}
                                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition"
                              >
                                <CheckCircle2 size={18} /> Duyệt
                              </button>
                              <button
                                onClick={() => { setShowRejectModal(review); setRejectReason(''); }}
                                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition"
                              >
                                <XCircle size={18} /> Từ chối
                              </button>
                            </>
                          )}
                          
                          <button
                            onClick={() => handleEdit(review)}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 rounded-xl font-bold hover:bg-blue-100 transition"
                          >
                            <Edit2 size={18} /> Sửa phiếu
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-700 rounded-xl font-bold hover:bg-red-100 transition"
                      >
                        <Trash2 size={18} /> Xóa
                      </button>
                    </div>
                  </div>
                )}
                

              </div>
            );
          })}
        </div>
      )}

      {/* Modal tạo/sửa phiếu */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingReview ? 'Sửa phiếu kiểm duyệt' : 'Tạo phiếu kiểm duyệt'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mã lô *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingReview}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none disabled:bg-gray-100"
                  placeholder="Nhập mã lô"
                  value={formData.batch_code}
                  onChange={(e) => setFormData({ ...formData, batch_code: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tên người tạo phiếu *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Nhập tên người tạo phiếu"
                  value={formData.created_by_name}
                  onChange={(e) => setFormData({ ...formData, created_by_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tên người sở hữu *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Nhập tên người sở hữu"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Địa chỉ ví *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                  placeholder="0x..."
                  value={formData.wallet_address}
                  onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Địa chỉ</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Nhập địa chỉ"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>



              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Ghi chú</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Nhập ghi chú..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition flex items-center justify-center gap-2"
                >
                  <Save size={18} /> {editingReview ? 'Cập nhật' : 'Tạo phiếu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal chuyển phiếu */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Chuyển phiếu - Lô #{showTransferModal.batch_code}
                </h2>
                <button
                  onClick={() => setShowTransferModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={(e) => handleTransfer(e, showTransferModal.id)} className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Thông tin hiện tại</p>
                <p className="font-bold text-gray-800">{showTransferModal.owner_name}</p>
                {showTransferModal.address && <p className="text-sm text-gray-500">{showTransferModal.address}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tên người nhận *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Nhập tên người nhận"
                  value={transferFormData.to_name}
                  onChange={(e) => setTransferFormData({ ...transferFormData, to_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Địa chỉ *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Nhập địa chỉ"
                  value={transferFormData.to_address}
                  onChange={(e) => setTransferFormData({ ...transferFormData, to_address: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Địa chỉ ví *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                  placeholder="0x..."
                  value={transferFormData.to_wallet}
                  onChange={(e) => setTransferFormData({ ...transferFormData, to_wallet: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Ghi chú</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Nhập ghi chú..."
                  value={transferFormData.notes}
                  onChange={(e) => setTransferFormData({ ...transferFormData, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowTransferModal(null); setTransferFormData({ to_name: '', to_address: '', to_wallet: '', notes: '' }); }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition flex items-center justify-center gap-2"
                >
                  <Truck size={18} /> Xác nhận chuyển
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal sửa giai đoạn */}
      {showEditStepModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Sửa giai đoạn
                </h2>
                <button
                  onClick={() => setShowEditStepModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={(e) => handleEditStep(e, showEditStepModal.review.id, showEditStepModal.stepIndex)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tên người sở hữu *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nhập tên người sở hữu"
                  value={editStepFormData.owner_name}
                  onChange={(e) => setEditStepFormData({ ...editStepFormData, owner_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Địa chỉ ví *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  placeholder="0x..."
                  value={editStepFormData.wallet_address}
                  onChange={(e) => setEditStepFormData({ ...editStepFormData, wallet_address: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Địa chỉ</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nhập địa chỉ"
                  value={editStepFormData.address}
                  onChange={(e) => setEditStepFormData({ ...editStepFormData, address: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Ghi chú</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nhập ghi chú..."
                  value={editStepFormData.notes}
                  onChange={(e) => setEditStepFormData({ ...editStepFormData, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditStepModal(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal từ chối */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Từ chối phiếu - Lô #{showRejectModal.batch_code}
                </h2>
                <button
                  onClick={() => { setShowRejectModal(null); setRejectReason(''); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Lí do từ chối *</label>
                <textarea
                  rows={4}
                  required
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="Nhập lí do từ chối..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowRejectModal(null); setRejectReason(''); }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  <XCircle size={18} /> Xác nhận từ chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreBlockchainReview;
