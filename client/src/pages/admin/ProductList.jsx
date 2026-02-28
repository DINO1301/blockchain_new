import React, { useEffect, useState } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { 
  Edit3, Save, Loader2, Plus, X, Pill, Clock, FileText, ShieldAlert, Archive, 
  Image as ImageIcon, Download, Search, CheckSquare, Square, 
  Package, CircleDollarSign, Calendar, Info, FlaskConical, Stethoscope, Activity, 
  AlertTriangle, Thermometer, Images, FileSearch 
} from 'lucide-react';
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

    // Hàm format gạch đầu dòng cho các nội dung nhiều dòng
    const formatBulletPoints = (text) => {
      if (!text) return '-';
      // Nếu text đã có xuống dòng hoặc dài, ta sẽ chuẩn hóa thành gạch đầu dòng
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length > 1) {
        return lines.map(line => `• ${line.trim()}`).join('\n');
      }
      return text;
    };

    // 1. Tiêu đề chính
    const titleRow = worksheet.addRow(['QUẢN LÝ SẢN PHẨM']);
    titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.mergeCells('A1:L1'); // Mở rộng merge đến cột L
    worksheet.getRow(1).height = 35;

    // 2. Ngày tháng xuất
    const now = new Date();
    const dateStr = `Ngày xuất: ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}`;
    const dateRow = worksheet.addRow([dateStr]);
    dateRow.font = { italic: true };
    dateRow.alignment = { horizontal: 'right' };
    worksheet.mergeCells(`A2:L2`);

    worksheet.addRow([]); // Dòng trống

    // 3. Header bảng
    const headers = [
      'STT', 'Tên sản phẩm', 'Giá niêm yết', 'Dạng bào chế', 'HSD (tháng)', 
      'Thành phần', 'Công dụng', 'Cách dùng', 'Tác dụng phụ', 'Lưu ý', 'Bảo quản', 'Mô tả'
    ];
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4F46E5' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    headerRow.height = 25;

    // 4. Đổ dữ liệu
    dataToExport.forEach((p, index) => {
      const rowData = [
        index + 1,
        p.name,
        p.price ? `${p.price.toLocaleString()} ₫` : '0 ₫',
        p.dosageForm || '-',
        p.expiryMonths || '-',
        formatBulletPoints(p.ingredients),
        formatBulletPoints(p.uses),         // Sửa: uses thay vì usage
        formatBulletPoints(p.directions),   // Sửa: directions thay vì howToUse
        formatBulletPoints(p.sideEffects),
        formatBulletPoints(p.precautions), // Sửa: precautions thay vì notes
        formatBulletPoints(p.storage),
        formatBulletPoints(p.description)
      ];
      
      const row = worksheet.addRow(rowData);

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Căn lề
        if ([1, 2, 3, 4, 5].includes(colNumber)) { // Thêm cột 2 (Tên sản phẩm) vào danh sách căn giữa
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
        }
      });
    });

    // 5. Độ rộng cột
    const colWidths = [8, 30, 15, 18, 12, 25, 25, 25, 25, 25, 20, 30];
    colWidths.forEach((width, i) => {
      worksheet.getColumn(i + 1).width = width;
    });

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Quan_ly_san_pham_${Date.now()}.xlsx`);
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
      precautions: p.precautions || '',
      relatedDocsText: Array.isArray(p.relatedDocs) ? p.relatedDocs.join(', ') : ''
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
      const relatedDocUrls = (form.relatedDocsText || '').split(',').map(u => u.trim()).filter(Boolean);
      
      await updateDoc(doc(db, 'products', editing), {
        ...form,
        imageUrls: extraUrls,
        relatedDocs: relatedDocUrls,
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={cancel}
        >
          <div 
            className="bg-white w-full md:max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border p-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-6 border-b sticky top-0 bg-white z-10">
              <div className="p-3 bg-indigo-100 rounded-full text-primary">
                <Edit3 size={24} />
              </div>
              <div className="mr-auto">
                <h2 className="text-2xl font-bold text-gray-800">Chỉnh Sửa Sản Phẩm</h2>
                <p className="text-gray-500 text-sm">Cập nhật thông tin chi tiết cho sản phẩm</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={cancel} className="px-5 py-2.5 border rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition">Hủy bỏ</button>
                <button onClick={save} disabled={saving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl inline-flex items-center gap-2 font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition">
                  {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                  Lưu thay đổi
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="grid lg:grid-cols-3 gap-10">
                {/* Cột trái & giữa */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Package size={18} className="text-indigo-500"/> Tên thuốc / Sản phẩm
                      </label>
                      <input
                        className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                        placeholder="VD: Panadol Extra"
                        value={form.name}
                        onChange={e=>setForm({...form, name:e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <CircleDollarSign size={18} className="text-green-500"/> Giá bán niêm yết (VNĐ)
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                        placeholder="VD: 50000"
                        value={form.price}
                        onChange={e=>setForm({...form, price:e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Pill size={18} className="text-blue-500"/> Dạng bào chế
                      </label>
                      <input
                        className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                        placeholder="VD: Viên nén bao phim"
                        value={form.dosageForm}
                        onChange={e=>setForm({...form, dosageForm:e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Calendar size={18} className="text-orange-500"/> Hạn sử dụng (tháng)
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                        placeholder="VD: 36"
                        value={form.expiryMonths}
                        onChange={e=>setForm({...form, expiryMonths:e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Info size={18} className="text-indigo-500"/> Mô tả công dụng
                    </label>
                    <textarea
                      rows="3"
                      className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                      placeholder="VD: Giảm đau, hạ sốt nhanh chóng..."
                      value={form.description}
                      onChange={e=>setForm({...form, description:e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <FlaskConical size={18} className="text-purple-500"/> Thành phần
                    </label>
                    <textarea
                      rows="3"
                      className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                      placeholder="Mỗi viên chứa..."
                      value={form.ingredients}
                      onChange={e=>setForm({...form, ingredients:e.target.value})}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Stethoscope size={18} className="text-teal-500"/> Công dụng
                      </label>
                      <textarea
                        rows="3"
                        className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                        placeholder="Chỉ định, điều trị..."
                        value={form.uses}
                        onChange={e=>setForm({...form, uses:e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Activity size={18} className="text-blue-500"/> Cách dùng
                      </label>
                      <textarea
                        rows="3"
                        className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                        placeholder="Liều dùng, thời điểm..."
                        value={form.directions}
                        onChange={e=>setForm({...form, directions:e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-red-500"/> Tác dụng phụ
                      </label>
                      <textarea
                        rows="3"
                        className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                        placeholder="Buồn ngủ, chóng mặt..."
                        value={form.sideEffects}
                        onChange={e=>setForm({...form, sideEffects:e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Thermometer size={18} className="text-orange-500"/> Bảo quản
                      </label>
                      <textarea
                        rows="3"
                        className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                        placeholder="Nhiệt độ, tránh ẩm..."
                        value={form.storage}
                        onChange={e=>setForm({...form, storage:e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <ShieldAlert size={18} className="text-amber-500"/> Lưu ý
                    </label>
                    <textarea
                      rows="3"
                      className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                      placeholder="Chống chỉ định, thận trọng..."
                      value={form.precautions}
                      onChange={e=>setForm({...form, precautions:e.target.value})}
                    />
                  </div>
                </div>

                {/* Cột phải */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <ImageIcon size={18} className="text-indigo-500"/> Link Ảnh chính (URL)
                      </label>
                      <input
                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white"
                        placeholder="https://..."
                        value={form.imageUrl || ''}
                        onChange={e=>setForm({...form, imageUrl:e.target.value})}
                      />
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl h-56 flex items-center justify-center overflow-hidden bg-white relative group">
                      {form.imageUrl ? (
                        <img src={form.imageUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                      ) : (
                        <div className="text-center">
                          <ImageIcon size={40} className="mx-auto text-gray-300 mb-2" />
                          <span className="text-gray-400 text-xs font-medium">Xem trước hình ảnh</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Images size={18} className="text-indigo-500"/> Ảnh bổ sung (phân tách bằng dấu phẩy)
                      </label>
                      <textarea
                        rows="3"
                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white text-sm"
                        placeholder="https://..., https://..."
                        value={form.imageUrlsText || ''}
                        onChange={e=>setForm({...form, imageUrlsText: e.target.value})}
                      />
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {(form.imageUrlsText || '').split(',').map(u => u.trim()).filter(Boolean).slice(0, 6).map((u, i) => (
                          <div key={i} className="w-full h-16 border rounded-lg overflow-hidden bg-white">
                            <img src={u} className="w-full h-full object-cover" alt={`extra-${i}`} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <FileSearch size={18} className="text-indigo-500"/> Giấy tờ liên quan (link ảnh)
                      </label>
                      <textarea
                        rows="3"
                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white text-sm"
                        placeholder="https://..., https://..."
                        value={form.relatedDocsText || ''}
                        onChange={e=>setForm({...form, relatedDocsText: e.target.value})}
                      />
                    </div>
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
