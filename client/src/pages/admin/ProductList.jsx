import React, { useEffect, useState } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Edit3, Save, Loader2, Plus, X, Pill, Clock, FileText, ShieldAlert, Archive, Image as ImageIcon, Download, Search, CheckSquare, Square } from 'lucide-react';
import { Link } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, 'products'));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setProducts(list);
    setFilteredProducts(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Xử lý lọc sản phẩm
  useEffect(() => {
    const filtered = products.filter(p => 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.dosageForm?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const exportToExcel = async () => {
    const dataToExport = products.filter(p => selectedIds.includes(p.id));
    if (dataToExport.length === 0) return alert('Vui lòng chọn ít nhất một sản phẩm để xuất!');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách sản phẩm');

    // 1. Tiêu đề chính
    const titleRow = worksheet.addRow(['QUẢN LÝ SẢN PHẨM']);
    titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.mergeCells('A1:F1');
    worksheet.getRow(1).height = 30;

    // 2. Ngày tháng xuất
    const now = new Date();
    const dateStr = `Ngày xuất: ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const dateRow = worksheet.addRow([dateStr]);
    dateRow.font = { italic: true };
    dateRow.alignment = { horizontal: 'right' };
    worksheet.mergeCells(`A2:F2`);

    worksheet.addRow([]); // Dòng trống

    // 3. Header bảng
    const headerRow = worksheet.addRow(['STT', 'Tên sản phẩm', 'Giá niêm yết', 'Dạng bào chế', 'HSD (tháng)', 'Mô tả']);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4F46E5' } // Màu indigo-600
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // 4. Đổ dữ liệu
    dataToExport.forEach((p, index) => {
      const row = worksheet.addRow([
        index + 1,
        p.name,
        p.price ? `${p.price.toLocaleString()} ₫` : '0 ₫',
        p.dosageForm || '-',
        p.expiryMonths || '-',
        p.description || '-'
      ]);

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        // Căn lề
        if (colNumber === 1 || colNumber === 3 || colNumber === 5) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        }
      });
    });

    // 5. Độ rộng cột
    worksheet.getColumn(1).width = 8;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 15;
    worksheet.getColumn(4).width = 20;
    worksheet.getColumn(5).width = 12;
    worksheet.getColumn(6).width = 40;

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Danh_sach_san_pham_${Date.now()}.xlsx`);
  };

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({
      name: p.name || '',
      price: p.price || '',
      description: p.description || '',
      imageUrl: p.imageUrl || '',
      imageUrlsText: Array.isArray(p.imageUrls) ? p.imageUrls.join(', ') : '',
      dosageForm: p.dosageForm || '',
      expiryMonths: p.expiryMonths ?? '',
      ingredients: p.ingredients || '',
      uses: p.uses || '',
      directions: p.directions || '',
      sideEffects: p.sideEffects || '',
      storage: p.storage || '',
      precautions: p.precautions || ''
    });
  };

  const cancel = () => {
    setEditing(null);
    setForm({});
  };

  const save = async () => {
    setSaving(true);
    try {
      const extraUrls = (form.imageUrlsText || '').split(',').map(u => u.trim()).filter(Boolean);
      await updateDoc(doc(db, 'products', editing), {
        ...form,
        imageUrls: extraUrls,
        imageUrl: form.imageUrl || extraUrls[0] || '',
        price: Number(form.price),
        expiryMonths: form.expiryMonths ? Number(form.expiryMonths) : null,
        updatedAt: new Date().toISOString()
      });
      await load();
      cancel();
      alert('✅ Đã cập nhật sản phẩm');
    } catch (e) {
      alert('Lỗi: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý sản phẩm</h1>
          <p className="text-gray-500 text-sm">Danh sách thuốc và thực phẩm chức năng trong hệ thống</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={exportToExcel}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition shadow-sm"
          >
            <Download size={18}/> Xuất Excel ({selectedIds.length})
          </button>
          <Link to="/admin/products/new" className="inline-flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-sm">
            <Plus size={18}/> Thêm sản phẩm
          </Link>
        </div>
      </div>

      {/* Thanh bộ lọc */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Tìm kiếm theo tên hoặc dạng bào chế..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 whitespace-nowrap">
          <span>Hiển thị: <strong>{filteredProducts.length}</strong> sản phẩm</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="px-4 py-3 text-center w-12">
                  <button onClick={toggleSelectAll} className="text-primary hover:scale-110 transition">
                    {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? (
                      <CheckSquare size={20} />
                    ) : (
                      <Square size={20} />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Tên sản phẩm</th>
                <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Giá niêm yết</th>
                <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Dạng bào chế</th>
                <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">HSD</th>
                <th className="px-4 py-3 text-center font-bold uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td className="px-4 py-10 text-center" colSpan="6">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-primary" size={32}/>
                      <span className="text-gray-500">Đang tải danh sách...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-gray-500" colSpan="6">
                    {searchTerm ? 'Không tìm thấy sản phẩm nào phù hợp' : 'Chưa có sản phẩm nào'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => (
                  <tr 
                    key={p.id} 
                    className={`hover:bg-blue-50/50 transition cursor-pointer ${selectedIds.includes(p.id) ? 'bg-blue-50' : ''}`}
                    onClick={() => toggleSelect(p.id)}
                  >
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => toggleSelect(p.id)} className="text-gray-400 hover:text-primary transition">
                        {selectedIds.includes(p.id) ? (
                          <CheckSquare size={20} className="text-primary" />
                        ) : (
                          <Square size={20} />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-indigo-600 font-bold">{p.price?.toLocaleString()} ₫</td>
                    <td className="px-4 py-3 text-gray-600">{p.dosageForm || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600 font-medium">
                        {p.expiryMonths ? p.expiryMonths + ' tháng' : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => startEdit(p)} className="inline-flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-primary hover:bg-primary hover:text-white transition shadow-sm">
                        <Edit3 size={14}/> Sửa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={cancel}
        >
          <div 
            className="bg-white w-full md:max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header giống form Thêm */}
            <div className="flex items-center gap-3 mb-6 border-b pb-4 sticky top-0 bg-white z-10">
              <div className="p-3 bg-indigo-100 rounded-full text-primary">
                <Edit3 size={22} />
              </div>
              <div className="mr-auto">
                <h2 className="text-2xl font-bold text-gray-800">Sửa Sản Phẩm</h2>
                <p className="text-gray-500 text-sm">Chỉnh sửa thông tin và xác nhận để cập nhật</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={cancel} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Hủy sửa</button>
                <button onClick={save} disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg inline-flex items-center gap-2">
                  {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                  Xác nhận
                </button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên thuốc / Sản phẩm</label>
                  <input
                    className="w-full px-3 py-2 border rounded"
                    placeholder="VD: Panadol Extra"
                    value={form.name}
                    onChange={e=>setForm({...form, name:e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán niêm yết (VNĐ)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded"
                    placeholder="VD: 50000"
                    value={form.price}
                    onChange={e=>setForm({...form, price:e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Pill size={14}/> Dạng bào chế</label>
                    <input
                      className="w-full px-3 py-2 border rounded"
                      placeholder="VD: Viên nén bao phim"
                      value={form.dosageForm}
                      onChange={e=>setForm({...form, dosageForm:e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Clock size={14}/> Hạn sử dụng (tháng)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded"
                      placeholder="VD: 36"
                      value={form.expiryMonths}
                      onChange={e=>setForm({...form, expiryMonths:e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><FileText size={14}/> Mô tả công dụng</label>
                  <textarea
                    rows="4"
                    className="w-full px-3 py-2 border rounded"
                    placeholder="VD: Giảm đau, hạ sốt nhanh chóng..."
                    value={form.description}
                    onChange={e=>setForm({...form, description:e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><FileText size={14}/> Thành phần</label>
                  <textarea
                    rows="3"
                    className="w-full px-3 py-2 border rounded"
                    placeholder="Mỗi viên chứa..."
                    value={form.ingredients}
                    onChange={e=>setForm({...form, ingredients:e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><FileText size={14}/> Công dụng</label>
                    <textarea
                      rows="3"
                      className="w-full px-3 py-2 border rounded"
                      placeholder="Chỉ định, điều trị..."
                      value={form.uses}
                      onChange={e=>setForm({...form, uses:e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><FileText size={14}/> Cách dùng</label>
                    <textarea
                      rows="3"
                      className="w-full px-3 py-2 border rounded"
                      placeholder="Liều dùng, thời điểm..."
                      value={form.directions}
                      onChange={e=>setForm({...form, directions:e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><ShieldAlert size={14}/> Tác dụng phụ</label>
                    <textarea
                      rows="3"
                      className="w-full px-3 py-2 border rounded"
                      placeholder="Buồn ngủ, chóng mặt..."
                      value={form.sideEffects}
                      onChange={e=>setForm({...form, sideEffects:e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Archive size={14}/> Bảo quản</label>
                    <textarea
                      rows="3"
                      className="w-full px-3 py-2 border rounded"
                      placeholder="Nhiệt độ, tránh ẩm..."
                      value={form.storage}
                      onChange={e=>setForm({...form, storage:e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><ShieldAlert size={14}/> Lưu ý</label>
                  <textarea
                    rows="3"
                    className="w-full px-3 py-2 border rounded"
                    placeholder="Chống chỉ định, thận trọng..."
                    value={form.precautions}
                    onChange={e=>setForm({...form, precautions:e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link Ảnh sản phẩm (URL)</label>
                  <div className="flex gap-2">
                    <input
                      className="w-full px-3 py-2 border rounded"
                      placeholder="https://..."
                      value={form.imageUrl || ''}
                      onChange={e=>setForm({...form, imageUrl:e.target.value})}
                    />
                    <div className="p-2 bg-gray-100 rounded border">
                      <ImageIcon size={20} className="text-gray-500" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">*Tip: Dán URL ảnh để xem trước.</p>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-xl h-48 flex items-center justify-center overflow-hidden bg-gray-50">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-400 text-sm">Xem trước hình ảnh</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh sách ảnh bổ sung (phân tách bằng dấu phẩy)</label>
                  <textarea
                    rows="3"
                    className="w-full px-3 py-2 border rounded"
                    placeholder="https://..., https://..., ..."
                    value={form.imageUrlsText || ''}
                    onChange={e=>setForm({...form, imageUrlsText: e.target.value})}
                  />
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {(form.imageUrlsText || '').split(',').map(u => u.trim()).filter(Boolean).map((u, i) => (
                      <div key={i} className="w-full h-16 border rounded overflow-hidden">
                        <img src={u} className="w-full h-full object-cover" alt={`extra-${i}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
