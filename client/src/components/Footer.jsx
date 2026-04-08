import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Facebook, CreditCard, Wallet, Apple } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#111827] text-gray-400 pt-0 pb-12 font-sans mt-auto border-t border-gray-800">
      {/* Top Blue Bar */}
      <div className="bg-[#1D4ED8] text-white py-5 mb-10 mt-0">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-medium">
            <MapPin size={20} />
            <span>Xem hệ thống 2474 nhà thuốc trên toàn quốc</span>
          </div>
          <button className="bg-[#111827] hover:bg-black text-white px-6 py-2 rounded-full text-sm font-bold transition-colors">
            Xem danh sách nhà thuốc
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* Cột 1: Về chúng tôi */}
        <div>
          <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-wider">Về chúng tôi</h4>
          <ul className="space-y-3 text-xs">
            <li><Link to="#" className="hover:text-white transition-colors">Giới thiệu</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors">Hệ thống cửa hàng</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors">Giấy phép kinh doanh</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors">Quy chế hoạt động</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors">Chính sách đặt cọc</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors">Chính sách nội dung</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors">Chính sách đổi trả thuốc</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors">Chính sách giao hàng</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors">Chính sách bảo mật</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors">Chính sách thanh toán</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors">Kiểm tra hóa đơn điện tử</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors">Chính sách bảo mật dữ liệu cá nhân</Link></li>
          </ul>
        </div>

        {/* Cột 2: Danh mục */}
        <div>
          <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-wider">Danh mục</h4>
          <ul className="space-y-3 text-xs">
            <li><Link to="#" className="hover:text-white transition-colors text-[#3b82f6]">Thực phẩm chức năng</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors text-[#3b82f6]">Dược mỹ phẩm</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors text-[#3b82f6]">Thuốc</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors text-[#3b82f6]">Chăm sóc cá nhân</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors text-[#3b82f6]">Trang thiết bị y tế</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors text-[#3b82f6]">Đặt thuốc online</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors text-[#3b82f6]">Tiêm chủng MediTrack</Link></li>
          </ul>
        </div>

        {/* Cột 3: Tìm hiểu thêm */}
        <div>
          <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-wider">Tìm hiểu thêm</h4>
          <ul className="space-y-3 text-xs">
            <li><Link to="#" className="hover:text-white transition-colors text-[#3b82f6]">Góc sức khoẻ</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors text-[#3b82f6]">Tra cứu thuốc</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors text-[#3b82f6]">Tra cứu dược chất</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors text-[#3b82f6]">Tra cứu dược liệu</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors text-[#3b82f6]">Bệnh thường gặp</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors text-[#3b82f6]">Bệnh viện</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors text-[#3b82f6]">Đội ngũ chuyên môn</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors text-[#3b82f6]">Tin tức tuyển dụng</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors text-[#3b82f6]">Tin tức sự kiện</Link></li>
          </ul>
        </div>

        {/* Cột 4: Tổng đài & Chứng nhận */}
        <div>
          <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-wider">Tổng đài (8:00-22:00)</h4>
          <div className="space-y-4 text-xs mb-8">
            <div>
              <p className="mb-1">Tư vấn mua hàng</p>
              <p className="text-[#3b82f6] font-bold text-sm">18006928 <span className="text-gray-500 font-normal">(Nhánh 1)</span></p>
            </div>
            <div>
              <p className="mb-1">Trung tâm Vắc xin</p>
              <p className="text-[#3b82f6] font-bold text-sm">18006928 <span className="text-gray-500 font-normal">(Nhánh 2)</span></p>
            </div>
            <div>
              <p className="mb-1">Góp ý, khiếu nại và tiếp nhận cảnh báo thông tin vi phạm</p>
              <p className="text-[#3b82f6] font-bold text-sm">18006928 <span className="text-gray-500 font-normal">(Nhánh 3)</span></p>
            </div>
          </div>

          <h4 className="text-white font-bold mb-4 uppercase text-[10px] tracking-widest">Chứng nhận bởi</h4>
          <div className="flex gap-2 mb-8">
            <div className="w-10 h-6 bg-blue-900/50 rounded border border-blue-800 flex items-center justify-center text-[8px] font-bold text-blue-400">BCT</div>
            <div className="w-10 h-6 bg-blue-900/50 rounded border border-blue-800 flex items-center justify-center text-[8px] font-bold text-blue-400">DMCA</div>
            <div className="w-10 h-6 bg-blue-900/50 rounded border border-blue-800 flex items-center justify-center text-[8px] font-bold text-blue-400">G-SEC</div>
          </div>

          <h4 className="text-white font-bold mb-4 uppercase text-[10px] tracking-widest">Hỗ trợ thanh toán</h4>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white p-1 rounded h-6 flex items-center justify-center"><CreditCard size={14} className="text-blue-800" /></div>
            <div className="bg-white p-1 rounded h-6 flex items-center justify-center text-[8px] font-bold text-red-600">VISA</div>
            <div className="bg-white p-1 rounded h-6 flex items-center justify-center text-[8px] font-bold text-orange-500">MC</div>
            <div className="bg-white p-1 rounded h-6 flex items-center justify-center text-[8px] font-bold text-blue-600">JCB</div>
            <div className="bg-white p-1 rounded h-6 flex items-center justify-center text-[8px] font-bold text-pink-500">MoMo</div>
            <div className="bg-white p-1 rounded h-6 flex items-center justify-center text-[8px] font-bold text-blue-400">Zalo</div>
            <div className="bg-white p-1 rounded h-6 flex items-center justify-center text-[8px] font-bold text-red-500 italic">VNPay</div>
            <div className="bg-white p-1 rounded h-6 flex items-center justify-center"><Apple size={14} className="text-black" /></div>
          </div>
        </div>

        {/* Cột 5: Kết nối & QR */}
        <div>
          <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-wider">Kết nối với chúng tôi</h4>
          <div className="flex gap-4 mb-10">
            <Link to="#" className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
              <Facebook size={20} />
            </Link>
            <Link to="#" className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-white hover:bg-blue-500 transition-colors">
              <span className="font-black italic text-sm">Zalo</span>
            </Link>
          </div>

          <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Tải ứng dụng MediTrack</h4>
          <div className="bg-white p-3 rounded-2xl w-32 h-32 flex items-center justify-center shadow-lg">
            {/* Giả lập QR Code bằng div */}
            <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center text-[10px] text-gray-400 font-bold text-center leading-tight">
              MediTrack<br/>QR Code
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 mt-16 pt-8 border-t border-gray-800 text-center">
        <p className="text-[10px] leading-relaxed">
          © 2024 Công ty Cổ phần Dược phẩm MediTrack. Số ĐKKD 0315275368 cấp ngày 17/09/2018 tại Sở Kế hoạch Đầu tư TP.HCM<br/>
          Địa chỉ: 379-381 Hai Bà Trưng, P. Võ Thị Sáu, Q.3, TP. Hồ Chí Minh. Số điện thoại: (028)73023456. Email: hỗ trợ@meditrack.vn<br/>
          Người quản lý nội dung: Nguyễn Trung Hiếu
        </p>
      </div>
    </footer>
  );
};

export default Footer;
