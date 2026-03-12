import { Link } from 'react-router-dom';
import { ShieldCheck, Search, ShoppingCart, Activity, Database, Lock } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      
      {/* --- HERO SECTION --- */}
      <div className="relative text-white overflow-hidden bg-[radial-gradient(circle_at_70%_30%,#1e3a8a_0%,#0a192f_100%)]">
        
        {/* Họa tiết nền (Background Pattern) */}
        <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-overlay filter blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20 md:py-32 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            
            {/* Cột Trái: Text giới thiệu */}
            <div className="md:w-1/2 space-y-6">
              {/* Badge: Huy hiệu nổi bật */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-medium backdrop-blur-sm animate-fade-in-up">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Hệ thống vận hành trên Sepolia Testnet
              </div>

              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight font-heading">
                Minh bạch nguồn gốc <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">
                  Dược phẩm & Y tế
                </span>
              </h1>
              
              <p className="text-lg text-blue-100/80 max-w-lg leading-relaxed">
                MediTrack ứng dụng công nghệ Blockchain để chống thuốc giả. 
                Theo dõi hành trình viên thuốc từ nhà máy sản xuất đến tận tay người tiêu dùng.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/shop" className="px-8 py-4 bg-white text-indigo-900 rounded-xl font-bold hover:bg-blue-50 transition shadow-lg flex items-center justify-center gap-2">
                  <ShoppingCart size={20} /> Mua Thuốc Ngay
                </Link>
                <Link to="/tracking" className="px-8 py-4 bg-indigo-700/50 border border-indigo-500/50 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 backdrop-blur-sm">
                  <Search size={20} /> Tra Cứu QR
                </Link>
              </div>

              {/* Stats nhỏ */}
              <div className="pt-8 flex items-center gap-8 border-t border-white/10 mt-8">
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
              <div className="relative z-10 bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-[2rem] shadow-2xl transform rotate-3 hover:rotate-0 transition duration-500">
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
                <div className="mt-6 flex justify-between items-center text-sm text-gray-300 font-mono">
                    <span>TxHash: 0x8a7...f9c</span>
                    <span className="text-green-400">Confirmed</span>
                </div>
              </div>

              {/* Card bay bay phía sau */}
              <div className="absolute top-10 -right-10 w-64 bg-blue-600/30 p-6 rounded-2xl shadow-xl -z-10 opacity-80 transform -rotate-6"></div>
            </div>
          </div>
        </div>
      </div>

      {/* --- FEATURES SECTION --- */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 font-heading">Tại sao chọn MediTrack?</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Giải pháp kết hợp sức mạnh của Web2 (Thương mại điện tử) và Web3 (Blockchain) để giải quyết bài toán niềm tin.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-lg transition group">
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <Database size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Dữ liệu bất biến</h3>
            <p className="text-gray-500 leading-relaxed">
              Một khi thông tin lô thuốc được ghi lên Blockchain, không ai (kể cả Admin) có thể sửa đổi hoặc xóa bỏ.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-lg transition group">
            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <Activity size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Real-time Tracking</h3>
            <p className="text-gray-500 leading-relaxed">
              Cập nhật trạng thái lô thuốc theo thời gian thực. Từ nhà máy, qua vận chuyển, đến kho đại lý.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-lg transition group">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <Lock size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Chống hàng giả</h3>
            <p className="text-gray-500 leading-relaxed">
              Mỗi hộp thuốc đều có định danh duy nhất (QR Code) gắn liền với Smart Contract, ngăn chặn việc trà trộn hàng giả.
            </p>
          </div>
        </div>
      </div>

      {/* --- CTA SECTION (Kêu gọi hành động) --- */}
      <div className="bg-gray-900 py-20 text-center text-white relative overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Sẵn sàng trải nghiệm công nghệ mới?</h2>
            <p className="text-gray-400 mb-8 text-lg">
                Tham gia cùng hàng ngàn người dùng đang bảo vệ sức khỏe của mình bằng công nghệ Blockchain.
            </p>
            <div className="flex justify-center gap-4">
                <Link to="/register" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition">
                    Đăng ký miễn phí
                </Link>
                <Link to="/shop" className="px-8 py-3 bg-transparent border border-gray-600 hover:bg-gray-800 text-white rounded-lg font-bold transition">
                    Dạo quanh cửa hàng
                </Link>
            </div>
        </div>
        
        {/* Abstract Circles Background */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-20"></div>
      </div>

    </div>
  );
};

export default Home;
