import { Link } from 'react-router-dom';
import { ShieldCheck, Search, ShoppingCart, Activity, Database, Lock } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-brand-lightBlue">
      
      {/* --- HERO SECTION --- */}
      <div className="relative text-brand-navy overflow-hidden bg-brand-lightBlue">
        
        {/* Họa tiết nền (Background Pattern) */}
        <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full mix-blend-multiply filter blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20 md:py-32 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            
            {/* Cột Trái: Text giới thiệu */}
            <div className="md:w-1/2 space-y-6">
              {/* Badge: Huy hiệu nổi bật */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-sm font-medium backdrop-blur-sm animate-fade-in-up">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Hệ thống vận hành trên Sepolia Testnet
              </div>

              <h1 className="text-5xl md:text-7xl font-heading font-extrabold tracking-tight leading-tight">
                <span className="block whitespace-nowrap">Minh bạch nguồn gốc</span>
                <span className="block mt-4 pb-2 whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400 glow-text leading-[1.4]">
                  Dược phẩm & Y tế
                </span>
              </h1>
              
              <p className="text-lg text-blue-700/80 max-w-lg leading-relaxed">
                MediTrack ứng dụng công nghệ Blockchain để chống thuốc giả. 
                Theo dõi hành trình viên thuốc từ nhà máy sản xuất đến tận tay người tiêu dùng.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/shop" className="px-8 py-4 bg-white text-indigo-900 rounded-xl font-bold hover:bg-blue-50 transition shadow-lg flex items-center justify-center gap-2">
                  <ShoppingCart size={20} /> Mua Thuốc Ngay
                </Link>
                <Link to="/tracking" className="px-8 py-4 bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl font-bold hover:bg-indigo-200 transition flex items-center justify-center gap-2">
                  <Search size={20} /> Tra Cứu QR
                </Link>
              </div>

              {/* Stats nhỏ */}
              <div className="pt-8 flex items-center gap-8 border-t border-blue-200 mt-8">
                <div>
                  <h4 className="text-2xl font-bold">100%</h4>
                  <p className="text-xs text-blue-200 uppercase tracking-wider">Chính hãng</p>
                </div>
                <div>
                  <h4 className="text-2xl font-bold">2.5s</h4>
                  <p className="text-xs text-blue-200 uppercase tracking-wider">Tốc độ Block</p>
                </div>
                <div>
                  <h4 className="text-2xl font-bold">Secure</h4>
                  <p className="text-xs text-blue-200 uppercase tracking-wider">Mã hóa AES</p>
                </div>
              </div>
            </div>

            {/* Cột Phải: Hình ảnh minh họa (Abstract) */}
            <div className="md:w-1/2 relative hidden md:block">
              <div className="relative z-10 glass-card p-8 rounded-[2rem] shadow-2xl transform rotate-3 hover:rotate-0 transition duration-500 animate-float">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white">
                        <ShieldCheck size={28}/>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Xác thực thành công</h3>
                        <p className="text-sm text-gray-300">Lô thuốc #BATCH-2025-01</p>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="h-2 bg-white/20 rounded w-3/4"></div>
                    <div className="h-2 bg-white/20 rounded w-full"></div>
                    <div className="h-2 bg-white/20 rounded w-5/6"></div>
                </div>
                <div className="mt-6 flex justify-between items-center text-sm text-blue-700 font-mono">
                    <span>TxHash: 0x8a7...f9c</span>
                    <span className="text-green-400">Confirmed</span>
                </div>
              </div>

              {/* Card bay bay phía sau */}
              <div className="absolute top-10 -right-10 w-64 bg-blue-600/30 p-6 rounded-2xl shadow-xl -z-10 opacity-80 transform -rotate-6"></div>

              <div className="absolute -top-20 -right-20 w-[600px] h-[600px] opacity-20 pointer-events-none">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <path d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,76.4,-44.7C83.7,-31.3,87,-15.7,85.1,-0.1C83.1,15.5,75.9,31,66.6,43.5C57.3,56,45.8,65.5,32.7,71.4C19.6,77.3,4.8,79.5,-10,77.8C-24.8,76.1,-39.6,70.5,-52.1,61.1C-64.6,51.7,-74.8,38.5,-79.8,23.7C-84.8,8.9,-84.6,-7.5,-79.5,-22.3C-74.4,-37.1,-64.4,-50.3,-51.7,-57.8C-39,-65.3,-23.5,-67.1,-8.6,-73.4C6.2,-79.6,18.7,-90.4,31.3,-91.9C43.9,-93.4,56.5,-85.7,44.7,-76.4Z" fill="#00f2ff" transform="translate(100 100)"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- FEATURES SECTION --- */}
      <div className="bg-white py-24 relative overflow-hidden">
        {/* Họa tiết nền phụ cho section này */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 font-heading tracking-tight">Tại sao chọn MedTrack?</h2>
            <div className="w-20 h-1.5 bg-primary mx-auto rounded-full mb-6"></div>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">
              Giải pháp kết hợp sức mạnh của <span className="text-primary font-bold">Web2</span> (Thương mại điện tử) và <span className="text-indigo-600 font-bold">Web3</span> (Blockchain) để giải quyết bài toán niềm tin.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-10 rounded-[2rem] bg-white border border-gray-100 hover:border-primary/30 hover:shadow-[0_20px_50px_rgba(19,128,236,0.15)] transition-all duration-500 group cursor-default">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white group-hover:rotate-[360deg] transition-all duration-700 shadow-sm">
                <Database size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Dữ liệu bất biến</h3>
              <p className="text-gray-500 leading-relaxed">
                Một khi thông tin lô thuốc được ghi lên Blockchain, không ai (kể cả Admin) có thể sửa đổi hoặc xóa bỏ.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-10 rounded-[2rem] bg-white border border-gray-100 hover:border-indigo-600/30 hover:shadow-[0_20px_50px_rgba(79,70,229,0.15)] transition-all duration-500 group cursor-default">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-[360deg] transition-all duration-700 shadow-sm">
                <Activity size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Real-time Tracking</h3>
              <p className="text-gray-500 leading-relaxed">
                Cập nhật trạng thái lô thuốc theo thời gian thực. Từ nhà máy, qua vận chuyển, đến kho đại lý.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-10 rounded-[2rem] bg-white border border-gray-100 hover:border-green-600/30 hover:shadow-[0_20px_50px_rgba(22,163,74,0.15)] transition-all duration-500 group cursor-default">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-green-600 group-hover:text-white group-hover:rotate-[360deg] transition-all duration-700 shadow-sm">
                <Lock size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Chống hàng giả</h3>
              <p className="text-gray-500 leading-relaxed">
                Mỗi hộp thuốc đều có định danh duy nhất (QR Code) gắn liền với Smart Contract, ngăn chặn việc trà trộn hàng giả.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- CTA SECTION (Kêu gọi hành động) --- */}
      <div className="bg-brand-lightBlue py-20 text-center text-brand-navy relative overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Sẵn sàng trải nghiệm công nghệ mới?</h2>
            <p className="text-blue-700 mb-8 text-lg">
                Tham gia cùng hàng ngàn người dùng đang bảo vệ sức khỏe của mình bằng công nghệ Blockchain.
            </p>
            <div className="flex justify-center gap-4">
                <Link to="/shop" className="px-8 py-3 bg-transparent border border-blue-600 hover:bg-blue-50 text-brand-navy rounded-lg font-bold transition">
                    Dạo quanh cửa hàng
                </Link>
            </div>
        </div>
        
        {/* Abstract Circles Background */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-300 rounded-full blur-[100px] opacity-20"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-300 rounded-full blur-[100px] opacity-20"></div>
      </div>

      {/* FOOTER */}
      <footer className="bg-brand-lightBlue border-t border-blue-200 py-12 text-brand-navy">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-[10px] font-bold">M</div>
              <p className="text-sm font-medium"><span className="font-bold">MedTrack</span> <span className="text-blue-700 ml-2">© 2024. All rights reserved.</span></p>
            </div>
            <div className="flex space-x-8 text-sm text-blue-700">
              <a href="#" className="hover:text-blue-900 transition-colors">Điều khoản</a>
              <a href="#" className="hover:text-blue-900 transition-colors">Bảo mật</a>
              <a href="#" className="hover:text-blue-900 transition-colors">Liên hệ</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
