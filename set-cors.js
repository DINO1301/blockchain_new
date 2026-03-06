const { Storage } = require('@google-cloud/storage');

// 1. Kết nối với Firebase bằng file key
const storage = new Storage({
  keyFilename: './service-account.json', // Đường dẫn đến file key bạn vừa tải về
});

// 2. Điền chính xác tên bucket của bạn (bỏ phần gs:// đi)
// Chú ý: Đôi khi bucket không có đuôi .appspot.com, hãy kiểm tra kỹ trong Firebase Console > Storage
const bucketName = 'meditrack-d10f7.firebasestorage.app';

async function configureCors() {
  const corsConfiguration = [
    {
      // Dùng dấu * để cho phép MỌI domain (rất hữu ích khi test local)
      origin: ['*'], 
      method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      responseHeader: [
        'Content-Type',
        'Authorization',
        'Content-Length',
        'User-Agent',
        'x-goog-resumable',
      ],
      maxAgeSeconds: 3600,
    },
  ];

  try {
    // 3. Thực thi việc thiết lập CORS
    await storage.bucket(bucketName).setCorsConfiguration(corsConfiguration);
    console.log(`✅ Thành công! Đã cấu hình CORS cho bucket: ${bucketName}`);
    
    // Kiểm tra lại xem cấu hình đã lưu chưa
    const [metadata] = await storage.bucket(bucketName).getMetadata();
    console.log('Cấu hình CORS hiện tại:', JSON.stringify(metadata.cors, null, 2));

  } catch (error) {
    console.error('❌ Có lỗi xảy ra:', error);
  }
}

configureCors();