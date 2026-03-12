import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { 
  Edit3, Save, Loader2, Plus, X, Pill, Clock, FileText, ShieldAlert, Archive, 
  Image as ImageIcon, Download, Search, CheckSquare, Square, 
  Package, CircleDollarSign, Calendar, Info, FlaskConical, Stethoscope, Activity, 
  AlertTriangle, Thermometer, FileSearch, QrCode, Upload, Filter, GripVertical 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { PRODUCT_CATEGORIES } from '../../utils/categories';

const UploadSection = ({ title, field, value, icon: IconEl, colorClass, uploading, handleFileUpload, setForm, reorderConfig }) => {
  const [localLink, setLocalLink] = useState('');
  const inputId = `edit-upload-${field}`;
  const urlsFromValue = (value || '').split(',').map(u => u.trim()).filter(u => u);
  const urls = reorderConfig?.urls ?? urlsFromValue;
  const [dragIdx, setDragIdx] = useState(null);

  // Hàm xóa ảnh/file khỏi danh sách
  const removeFile = (field, index) => {
    const targetField = field === 'main' ? 'imageUrl' : 
                       field === 'extra' ? 'imageUrlsText' : 
                       field === 'docs' ? 'relatedDocsText' : 'relatedQRsText';
    
    const currentUrls = (value || '').split(',').map(u => u.trim()).filter(u => u);
    currentUrls.splice(index, 1);
    
    setForm(prev => ({
      ...prev,
      [targetField]: currentUrls.join(', ')
    }));
  };

  return (
    <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
          {IconEl ? <IconEl size={18} className={colorClass}/> : null} {title}
        </label>
      </div>

      {/* Vùng kéo thả */}
      <div 
        className={`border-2 border-dashed rounded-xl p-6 h-40 flex flex-col items-center justify-center transition cursor-pointer hover:bg-gray-50 ${
          uploading[field] ? 'border-gray-300 bg-gray-50' : 'border-indigo-100'
        }`}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            handleFileUpload({ target: { files } }, field);
          }
        }}
        onClick={() => document.getElementById(inputId).click()}
      >
        <input 
          id={inputId}
          type="file" 
          className="hidden" 
          accept={field === 'docs' ? "image/*,application/pdf" : "image/*"} 
          multiple
          onChange={(e) => handleFileUpload(e, field)} 
        />
        {uploading[field] ? (
          <Loader2 size={24} className="animate-spin text-indigo-500 mb-2" />
        ) : (
          <Upload size={24} className="text-indigo-500 mb-2" />
        )}
        <span className="text-xs text-gray-500 font-medium text-center">
          {uploading[field] ? "Đang tải lên..." : "Chọn hoặc kéo thả ảnh"}
        </span>
      </div>

      {/* Nhập link trực tiếp */}
      <div className="flex gap-2">
        <input 
          type="url"
          placeholder="https://..."
          className="flex-1 px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50"
          value={localLink}
          onChange={(e) => setLocalLink(e.target.value)}
        />
        <button 
          type="button"
          onClick={() => {
            if (localLink.trim()) {
              const targetField = field === 'main' ? 'imageUrl' : 
                                 field === 'extra' ? 'imageUrlsText' : 
                                 field === 'docs' ? 'relatedDocsText' : 'relatedQRsText';
              
              if (reorderConfig) {
                const arr = [...(reorderConfig.urls || []), localLink.trim()];
                reorderConfig.setUrls(arr);
                if (reorderConfig.onSync) {
                  reorderConfig.onSync(arr);
                }
              } else {
                setForm(prev => ({ 
                  ...prev, 
                  [targetField]: prev[targetField] ? `${prev[targetField]}, ${localLink.trim()}` : localLink.trim() 
                }));
              }
              setLocalLink('');
            }
          }}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black transition shadow-sm"
        >
          Thêm
        </button>
      </div>

      {/* Danh sách file đã thêm (gọn, hỗ trợ kéo thả cho ảnh) */}
      {urls.length > 0 ? (
        <div className="space-y-1.5 pt-2 border-t border-gray-50">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">DANH SÁCH FILE ĐÃ THÊM</p>
          <div 
            className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1"
            onDragOver={(e)=>e.preventDefault()}
          >
            {urls.map((url, i) => {
              const isImg = /\.(png|jpe?g|webp|gif|svg)$/i.test(url);
              const handleRemove = () => {
                if (reorderConfig) {
                  const arr = urls.filter((_, idx) => idx !== i);
                  reorderConfig.setUrls(arr);
                  if (reorderConfig.onSync) {
                    reorderConfig.onSync(arr);
                  }
                } else {
                  removeFile(field, i);
                }
              };
              const handleDrop = () => {
                if (!reorderConfig || dragIdx === null || dragIdx === i) return;
                const arr = [...urls];
                const [moved] = arr.splice(dragIdx,1);
                arr.splice(i,0,moved);
                reorderConfig.setUrls(arr);
                if (reorderConfig.onSync) {
                  reorderConfig.onSync(arr);
                }
                setDragIdx(null);
              };
              return (
                <div
                  key={`${url}-${i}`}
                  draggable={Boolean(reorderConfig)}
                  onDragStart={()=>setDragIdx(i)}
                  onDrop={handleDrop}
                  className="group flex items-center gap-2 px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg max-w-full"
                >
                  {reorderConfig ? <GripVertical size={12} className="text-gray-400 cursor-grab" /> : null}
                  <div className="w-8 h-8 bg-white border rounded flex items-center justify-center overflow-hidden">
                    {isImg ? <img src={url} alt="" className="w-full h-full object-contain" /> : <ImageIcon size={12} className="text-gray-400" />}
                  </div>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[11px] text-blue-600 underline truncate max-w-[160px]"
                    title={url}
                  >
                    {url}
                  </a>
                  <button 
                    type="button" 
                    onClick={handleRemove}
                    className="p-1 hover:bg-red-50 rounded text-red-400"
                  >
                    <X size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Tất cả');
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({ main: false, extra: false, docs: false, qrs: false });
  const [allImages, setAllImages] = useState([]);
  const [allDocs, setAllDocs] = useState([]);
  const [allQrs, setAllQrs] = useState([]);
  const [dragIndex, setDragIndex] = useState(null);

  // Phân trang: 9 sản phẩm mỗi trang
  const [page, setPage] = useState(1);
  const perPage = 9;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / perPage));
  const start = (page - 1) * perPage;
  const visibleProductsList = filteredProducts.slice(start, start + perPage);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterCategory]);

  // Hàm xử lý upload file lên Supabase Storage (Hỗ trợ nhiều file)
  const handleFileUpload = async (event, field) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Kiểm tra định dạng và dung lượng cho từng file
    const isDoc = field === 'docs';
    const allowedTypes = isDoc 
      ? ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      : ['image/jpeg', 'image/png', 'image/webp'];
    const allowedExtensions = isDoc
      ? ['jpg', 'jpeg', 'png', 'webp', 'pdf']
      : ['jpg', 'jpeg', 'png', 'webp'];
    
    const validFiles = files.filter(file => {
      const fileExt = file.name.split('.').pop().toLowerCase();
      const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExt);
      
      if (!isValidType) {
        alert(`❌ File "${file.name}" không đúng định dạng. Hỗ trợ: ${allowedExtensions.join(', ')}`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`❌ File "${file.name}" quá lớn (>5MB).`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(prev => ({ ...prev, [field]: true }));
    try {
      const uploadPromises = validFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error } = await supabase.storage
          .from('meditrack')
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('meditrack')
          .getPublicUrl(filePath);
        
        return publicUrl;
      });

      const publicUrls = await Promise.all(uploadPromises);
      const joinedUrls = publicUrls.join(', ');

      // Cập nhật vào form tương ứng
      const targetField = field === 'main' ? 'imageUrl' : 
                         field === 'extra' ? 'imageUrlsText' : 
                         field === 'docs' ? 'relatedDocsText' : 'relatedQRsText';
      
      setForm(prev => ({ ...prev, [targetField]: prev[targetField] ? `${prev[targetField]}, ${joinedUrls}` : joinedUrls }));

      if (field === 'main') {
        const prevArr = [
          ...(form.imageUrl ? form.imageUrl.split(',').map(u=>u.trim()).filter(Boolean) : []),
          ...(form.imageUrlsText ? form.imageUrlsText.split(',').map(u=>u.trim()).filter(Boolean) : [])
        ];
        const newArr = [...prevArr, ...publicUrls];
        setAllImages(newArr);
      } else if (field === 'docs') {
        const prevArr = (form.relatedDocsText || '').split(',').map(u=>u.trim()).filter(Boolean);
        const newArr = [...prevArr, ...publicUrls];
        setAllDocs(newArr);
      } else if (field === 'qrs') {
        const prevArr = (form.relatedQRsText || '').split(',').map(u=>u.trim()).filter(Boolean);
        const newArr = [...prevArr, ...publicUrls];
        setAllQrs(newArr);
      }

      alert(`✅ Đã tải ${publicUrls.length} file lên thành công!`);
    } catch (error) {
      console.error("Lỗi upload:", error);
      alert("Lỗi upload: " + (error.message || "Không rõ lỗi"));
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }));
      event.target.value = '';
    }
  };

  const load = async () => {
    console.log("🚀 Đang tải danh sách sản phẩm...");
    setLoading(true);
    
    // Timeout an toàn 10 giây
    const timeout = setTimeout(() => {
      console.warn("⚠️ Tải danh sách quá lâu (10s), ép buộc tắt spinner.");
      setLoading(false);
    }, 10000);

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      console.log("✅ Đã tải xong:", data?.length || 0, "sản phẩm.");
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error("❌ Lỗi tải danh sách sản phẩm:", error);
      alert("Lỗi: " + error.message);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(); 
  }, []);

  // Xử lý lọc sản phẩm
  useEffect(() => {
    const filtered = products.filter(p => {
      const matchSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.dosage_form?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = filterCategory === 'Tất cả' || p.category === filterCategory;
      return matchSearch && matchCategory;
    });
    setFilteredProducts(filtered);
  }, [searchTerm, products, filterCategory]);

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

    // Hàm tải logo (trong thư mục public) và chuyển sang base64
    const loadImageAsBase64 = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Không tìm thấy ảnh ở đường dẫn: ${url}`);
  
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // BẮT BUỘC: Cắt bỏ phần "data:image/jpeg;base64," ở đầu chuỗi
      const base64data = reader.result.split(',')[1]; 
      resolve(base64data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

    // Hàm format gạch đầu dòng cho các nội dung nhiều dòng
    const formatBulletPoints = (text) => {
      if (!text) return '-';
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length > 1) {
        return lines.map(line => `• ${line.trim()}`).join('\n');
      }
      return text;
    };

    // (Không cần helper chuyển chỉ số cột -> chữ cái vì vùng merge đã cố định)

    // 1. Logo + Tên công ty + Tiêu đề báo cáo
    let imageId = null;
    const candidateLogos = [
      '/logo_thaiminh.jpg', // Ưu tiên logo chính
      '/logo.png',
      '/logo_thaiminh.jpeg'
    ];

    for (const path of candidateLogos) {
      try {
        const fullPath = path.startsWith('http') ? path : `${window.location.origin}${path}`;
        console.log('Đang thử load logo từ:', fullPath);
        const base64 = await loadImageAsBase64(fullPath);
        
        imageId = workbook.addImage({ 
          base64: base64, 
          extension: path.toLowerCase().endsWith('.png') ? 'png' : 'jpeg' 
        });
        
        console.log('✅ Load logo thành công tại:', fullPath);
        break; 
      } catch (error) { 
        console.log(`❌ Lỗi load ảnh ${path}:`, error.message);
      }
    }

    // Nếu vẫn không có file logo, tạo logo fallback bằng Canvas (màu xanh/da cam + chữ TM)
    if (imageId === null) {
      const generateFallbackLogoBase64 = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        // Nền trắng
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Hình biểu tượng (2 nửa xanh/da cam)
        ctx.save();
        ctx.translate(150, 90);
        ctx.rotate(-0.1);
        ctx.beginPath();
        ctx.moveTo(0, -40);
        ctx.bezierCurveTo(60, -90, 120, -10, 0, 70);
        ctx.bezierCurveTo(-120, -10, -60, -90, 0, -40);
        ctx.closePath();
        ctx.clip();
        // Chia đôi và tô màu
        ctx.fillStyle = '#1D4ED8'; // xanh
        ctx.fillRect(-150, -150, 300, 150);
        ctx.fillStyle = '#F59E0B'; // da cam
        ctx.fillRect(-150, 0, 300, 150);
        ctx.restore();
        // Dấu cộng trắng
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 18;
        ctx.beginPath();
        ctx.moveTo(150, 35); ctx.lineTo(150, 145);
        ctx.moveTo(90, 90); ctx.lineTo(210, 90);
        ctx.stroke();
        // Chữ TM nhỏ dưới biểu tượng
        ctx.fillStyle = '#1E3A8A';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Thái Minh', 150, 185);
        return canvas.toDataURL('image/png').split(',')[1];
      };
      try {
        const base64 = generateFallbackLogoBase64();
        imageId = workbook.addImage({ base64, extension: 'png' });
      } catch { /* ignore */ }
    }

    // Hàng 1: Logo (A1:B1) và Tên công ty căn giữa C1:D1
    worksheet.getCell('C1').value = 'CÔNG TY CỔ PHẦN DƯỢC PHẨM THÁI MINH';
    worksheet.mergeCells('C1:D1');
    worksheet.getCell('C1').font = { name: 'Arial', size: 14, bold: true, color: { argb: '1E3A8A' } };
    worksheet.getCell('C1').alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 130; // 1.81 inch ≈ 130 points

    // Chèn logo nếu có (A1:B1)
    if (imageId !== null) {
      try {
        // Chèn logo phủ kín vùng A1:B1
        worksheet.addImage(imageId, {
          tl: { col: 0, row: 0 },
          br: { col: 2, row: 1 },
          editAs: 'oneCell'
        });
      } catch (err) { 
        console.error('Lỗi chèn logo vào worksheet:', err);
      }
    }

// 2. Tiêu đề báo cáo (A2:N4)
worksheet.getCell('A2').value = 'BÁO CÁO SẢN PHẨM';
worksheet.mergeCells('A2:N4');
worksheet.getCell('A2').font = { name: 'Arial', size: 18, bold: true };
worksheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

// Khai báo chiều cao cho các dòng bị merge để khung hiển thị đủ lớn
worksheet.getRow(2).height = 30;
worksheet.getRow(3).height = 30;
worksheet.getRow(4).height = 30;

// 3. Ngày xuất (N5:N6)
const now = new Date();
const dd = String(now.getDate()).padStart(2, '0');
const mm = String(now.getMonth() + 1).padStart(2, '0');
const yyyy = now.getFullYear();
const HH = String(now.getHours()).padStart(2, '0');
const MM = String(now.getMinutes()).padStart(2, '0');
const dateStr = `Ngày xuất: ${dd}/${mm}/${yyyy} ${HH}:${MM}`;

worksheet.getCell('N5').value = dateStr;
worksheet.mergeCells('N5:N6');
worksheet.getCell('N5').font = { italic: true };
worksheet.getCell('N5').alignment = { horizontal: 'center', vertical: 'middle' };

// Căn chỉnh chiều cao cho vùng Ngày xuất
worksheet.getRow(5).height = 22;
worksheet.getRow(6).height = 22;

    // Hàng 7 sẽ là header bảng

    // 3. Header bảng
    const headers = [
      'STT', 'Ảnh', 'Tên sản phẩm', 'Danh mục', 'Giá niêm yết', 'Dạng bào chế', 'HSD (tháng)', 
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

    // (Không cần merge động nữa vì đã cố định theo yêu cầu)

    // 4. Đổ dữ liệu
    // Hàm lấy ảnh sản phẩm về Base64
    const fetchImageAsBase64 = async (url) => {
      if (!url) return null;
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const blob = await res.blob();
        // Chuyển về PNG nếu là WEBP/khác
        const mime = blob.type || '';
        if (mime === 'image/png' || mime === 'image/jpeg') {
          return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = (reader.result || '').toString().split(',')[1] || '';
              resolve({ base64, ext: mime === 'image/png' ? 'png' : 'jpeg' });
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
        // Convert sang PNG qua canvas
        const bmp = await createImageBitmap(blob);
        const canvas = document.createElement('canvas');
        canvas.width = bmp.width;
        canvas.height = bmp.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bmp, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1] || '';
        return { base64, ext: 'png' };
      } catch {
        return null;
      }
    };

    for (let i = 0; i < dataToExport.length; i++) {
      const p = dataToExport[i];
      const categoryStr = p.category ? `${p.category}${p.sub_category ? ` - ${p.sub_category}` : ''}` : '-';
      const rowData = [
        i + 1,
        '', // cột ảnh (sẽ chèn sau)
        p.name,
        categoryStr,
        p.price ? `${p.price.toLocaleString()} ₫` : '0 ₫',
        p.dosage_form || '-',
        p.expiry_months || '-',
        formatBulletPoints(p.ingredients),
        formatBulletPoints(p.uses),
        formatBulletPoints(p.directions),
        formatBulletPoints(p.side_effects),
        formatBulletPoints(p.precautions),
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
        
        // Cỡ chữ 12 cho tất cả các ô dữ liệu
        cell.font = { size: 12 };
        
        // Căn giữa cho các cột: STT(1), Ảnh(2), Tên sản phẩm(3), Danh mục(4), Giá(5), Dạng bào chế(6), HSD(7)
        if ([1, 2, 3, 4, 5, 6, 7].includes(colNumber)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
        }
      });
      
      // Chèn ảnh vào cột B cho hàng hiện tại
      const imgUrl = p.image_url || (Array.isArray(p.image_urls) && p.image_urls[0]) || '';
      const imgData = await fetchImageAsBase64(imgUrl);
      if (imgData && imgData.base64) {
        try {
          const imgId = workbook.addImage({ base64: imgData.base64, extension: imgData.ext || 'png' });
          // Tăng chiều cao hàng để chứa ảnh
          const rowNumber = row.number;
          worksheet.getRow(rowNumber).height = 110;
          
          // Chèn ảnh và căn giữa trong ô B
          worksheet.addImage(imgId, {
            tl: { col: 1, row: rowNumber - 1, colOff: 100000, rowOff: 100000 },
            br: { col: 2, row: rowNumber, colOff: -100000, rowOff: -100000 },
            editAs: 'oneCell'
          });
        } catch { /* ignore */ }
      }
    }

    // 5. Độ rộng cột (Tăng độ rộng C, D để tên công ty Thái Minh hiển thị đẹp)
    const colWidths = [10, 25, 45, 35, 18, 16, 12, 24, 24, 24, 24, 24, 18, 28];
    colWidths.forEach((width, i) => {
      worksheet.getColumn(i + 1).width = width;
    });

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    saveAs(new Blob([buffer], { type: mime }), `Quan_ly_san_pham_${Date.now()}.xlsx`);
  };

  const startEdit = (p) => {
    setEditing(p.id);
    const mainImageUrl = p.image_url || '';
    const otherImageUrls = Array.isArray(p.image_urls) ? p.image_urls.filter(url => url !== mainImageUrl) : [];
    
    setForm({
      name: p.name || '',
      price: p.price ?? '',
      category: p.category || '',
      sub_category: p.sub_category || '',
      description: p.description || '',
      imageUrl: mainImageUrl,
      imageUrlsText: otherImageUrls.join(', '),
      dosage_form: p.dosage_form || '',
      expiry_months: p.expiry_months ?? '',
      ingredients: p.ingredients || '',
      uses: p.uses || '',
      directions: p.directions || '',
      side_effects: p.side_effects || '',
      storage: p.storage || '',
      precautions: p.precautions || '',
      relatedDocsText: Array.isArray(p.related_docs) ? p.related_docs.join(', ') : '',
      relatedQRsText: Array.isArray(p.related_qrs) ? p.related_qrs.join(', ') : ''
    });
    setAllImages(Array.isArray(p.image_urls) ? p.image_urls : []);
    setAllDocs(Array.isArray(p.related_docs) ? p.related_docs : []);
    setAllQrs(Array.isArray(p.related_qrs) ? p.related_qrs : []);
  };

  const cancel = () => {
    setEditing(null);
    setForm({});
  };

  const save = async () => {
    setSaving(true);
    try {
      if (!form.name || !form.name.trim()) {
        alert('Vui lòng nhập tên sản phẩm');
        setSaving(false);
        return;
      }
      if (form.price === '' || Number(form.price) <= 0 || Number.isNaN(Number(form.price))) {
        alert('Giá bán phải là số > 0');
        setSaving(false);
        return;
      }
      if (!form.description || !form.description.trim()) {
        alert('Vui lòng nhập mô tả');
        setSaving(false);
        return;
      }

      // Gộp các link nhập tay và ảnh chính
      const mainImages = (form.imageUrl || '')
        .split(',')
        .map(u => u.trim())
        .filter(u => u);

      const extraUrls = (form.imageUrlsText || '')
        .split(',')
        .map(u => u.trim())
        .filter(u => u);

      const allImages = [...mainImages, ...extraUrls];
      
      const relatedDocUrls = (form.relatedDocsText || '')
        .split(',')
        .map(u => u.trim())
        .filter(u => u);

      const relatedQrUrls = (form.relatedQRsText || '')
        .split(',')
        .map(u => u.trim())
        .filter(u => u);
      
      const { error } = await supabase
        .from('products')
        .update({
          name: form.name,
          category: form.category,
          sub_category: form.sub_category,
          description: form.description,
          dosage_form: form.dosage_form,
          expiry_months: form.expiry_months ? Number(form.expiry_months) : null,
          ingredients: form.ingredients,
          uses: form.uses,
          directions: form.directions,
          side_effects: form.side_effects,
          storage: form.storage,
          precautions: form.precautions,
          image_urls: allImages,
          related_docs: relatedDocUrls,
          related_qrs: relatedQrUrls,
          image_url: mainImages[0] || extraUrls[0] || 'https://placehold.co/400',
          price: form.price !== '' ? Number(form.price) : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editing);

      if (error) throw error;

      alert('✅ Đã cập nhật sản phẩm thành công!');
      
      await load();
      cancel();
    } catch (error) {
      console.error("Lỗi cập nhật sản phẩm:", error);
      alert('❌ Lỗi hệ thống: ' + error.message);
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

      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên hoặc dạng bào chế..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={18} className="text-gray-400" />
          <select
            className="px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="Tất cả">Tất cả danh mục</option>
            {PRODUCT_CATEGORIES.map(cat => (
              <option key={cat.name} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500 whitespace-nowrap">
          <span>Hiển thị: <strong>{visibleProductsList.length}</strong> / <strong>{filteredProducts.length}</strong> sản phẩm (Trang {page}/{totalPages})</span>
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
                <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Danh mục</th>
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
              ) : visibleProductsList.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-gray-500" colSpan="6">
                    {searchTerm ? 'Không tìm thấy sản phẩm nào phù hợp' : 'Chưa có sản phẩm nào'}
                  </td>
                </tr>
              ) : (
                visibleProductsList.map(p => (
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
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-800">{p.category || '-'}</span>
                        <span className="text-[10px] text-gray-500">{p.sub_category}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-indigo-600 font-bold">{p.price?.toLocaleString()} ₫</td>
                    <td className="px-4 py-3 text-gray-600">{p.dosage_form || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600 font-medium">
                        {p.expiry_months ? p.expiry_months + ' tháng' : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => startEdit(p)} className="inline-flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-primary hover:bg-primary hover:text-white transition shadow-sm">
                          <Edit3 size={14}/> Sửa
                        </button>
                        <button 
                          onClick={async () => {
                            if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
                              const { error } = await supabase.from('products').delete().eq('id', p.id);
                              if (error) alert('Lỗi khi xóa: ' + error.message);
                              else load();
                            }
                          }}
                          className="inline-flex items-center gap-1 bg-white border border-red-200 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-600 hover:text-white transition shadow-sm"
                        >
                          <X size={14}/> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 0 && (
          <div className="p-4 bg-indigo-50/50 border-t flex justify-center items-center gap-4">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition shadow-sm"
            >
              Trước
            </button>
            <span className="text-sm font-bold text-gray-600">Trang {page} / {totalPages}</span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition shadow-sm"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {editing && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={cancel}
        >
            <div 
            className="bg-white w-full md:max-w-[90rem] max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border p-0"
            onClick={(e) => e.stopPropagation()}
          >
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
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-10">
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Package size={18} className="text-indigo-500"/> Tên thuốc / Sản phẩm
                      </label>
                      <input
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
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
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                        placeholder="VD: 50000"
                        value={form.price}
                        onChange={e=>setForm({...form, price:e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Filter size={18} className="text-indigo-500"/> Danh mục chính
                      </label>
                      <select
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                        value={form.category}
                        onChange={e=>{
                          const cat = e.target.value;
                          setForm({...form, category: cat, sub_category: ''});
                        }}
                      >
                        <option value="">Chọn danh mục chính</option>
                        {PRODUCT_CATEGORIES.map(cat => (
                          <option key={cat.name} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Filter size={18} className="text-indigo-500"/> Danh mục con
                      </label>
                      <select
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                        value={form.sub_category}
                        disabled={!form.category}
                        onChange={e=>setForm({...form, sub_category: e.target.value})}
                      >
                        <option value="">Chọn danh mục con</option>
                        {PRODUCT_CATEGORIES.find(cat => cat.name === form.category)?.subCategories.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Pill size={18} className="text-blue-500"/> Dạng bào chế
                      </label>
                      <input
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                        placeholder="VD: Viên nén bao phim"
                        value={form.dosage_form}
                        onChange={e=>setForm({...form, dosage_form:e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Calendar size={18} className="text-orange-500"/> Hạn sử dụng (tháng)
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30"
                        placeholder="VD: 36"
                        value={form.expiry_months}
                        onChange={e=>setForm({...form, expiry_months:e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Info size={18} className="text-indigo-500"/> Mô tả công dụng
                    </label>
                    <textarea
                      rows="3"
                      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30 min-h-36"
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
                      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30 min-h-36"
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
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30 min-h-36"
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
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30 min-h-36"
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
                      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30 min-h-36"
                        placeholder="Buồn ngủ, chóng mặt..."
                        value={form.side_effects}
                        onChange={e=>setForm({...form, side_effects:e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Thermometer size={18} className="text-orange-500"/> Bảo quản
                      </label>
                      <textarea
                        rows="3"
                      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30 min-h-36"
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
                      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50/30 min-h-40"
                      placeholder="Chống chỉ định, thận trọng..."
                      value={form.precautions}
                      onChange={e=>setForm({...form, precautions:e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <UploadSection 
                    title="Ảnh chính sản phẩm"
                    field="main"
                    value={form.imageUrl}
                    icon={ImageIcon}
                    colorClass="text-indigo-500"
                    uploading={uploading}
                    handleFileUpload={handleFileUpload}
                    setForm={setForm}
                    reorderConfig={{
                      urls: allImages,
                      setUrls: setAllImages,
                      onSync: (arr) => setForm(prev => ({ ...prev, imageUrl: arr[0] || '', imageUrlsText: arr.slice(1).join(', ') }))
                    }}
                  />

                  {/* Preview Ảnh chính */}
                  <div className="bg-white border border-gray-100 rounded-2xl h-64 flex items-center justify-center overflow-hidden shadow-sm relative group">
                    {form.imageUrl ? (
                      <img 
                        src={(Array.isArray(form.imageUrl) ? (form.imageUrl[0] || '') : String(form.imageUrl || '').split(',')[0]).trim()} 
                        alt="Preview" 
                        className="w-full h-full object-contain p-2" 
                      />
                    ) : (
                      <div className="text-center">
                        <ImageIcon size="40" className="mx-auto text-gray-200 mb-2" />
                        <span className="text-gray-400 text-xs font-medium">Xem trước hình ảnh</span>
                      </div>
                    )}
                  </div>
                  <UploadSection 
                    title="Giấy tờ liên quan"
                    field="docs"
                    value={form.relatedDocsText}
                    icon={FileSearch}
                    colorClass="text-indigo-500"
                    uploading={uploading}
                    handleFileUpload={handleFileUpload}
                    setForm={setForm}
                    reorderConfig={{
                      urls: allDocs,
                      setUrls: setAllDocs,
                      onSync: (arr) => setForm(prev => ({ ...prev, relatedDocsText: arr.join(', ') }))
                    }}
                  />

                  <UploadSection 
                    title="QR liên quan"
                    field="qrs"
                    value={form.relatedQRsText}
                    icon={QrCode}
                    colorClass="text-indigo-500"
                    uploading={uploading}
                    handleFileUpload={handleFileUpload}
                    setForm={setForm}
                    reorderConfig={{
                      urls: allQrs,
                      setUrls: setAllQrs,
                      onSync: (arr) => setForm(prev => ({ ...prev, relatedQRsText: arr.join(', ') }))
                    }}
                  />
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
