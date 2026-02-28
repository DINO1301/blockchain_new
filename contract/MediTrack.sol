// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MediTrack {
    
    // --- 1. CẤU TRÚC DỮ LIỆU (DATA STRUCTURES) ---

    // A. PRODUCT (Sản phẩm lẻ - Từng hộp thuốc)
    struct Product {
        string uid;             // Mã định danh duy nhất (VD: "BATCH1-001")
        uint256 batchId;        // Tham chiếu: Thuộc lô nào?
        bytes32 secretHash;     // BẢO MẬT: Hash của mã bí mật (Off-chain Key)
        bool isSold;            // Trạng thái: Đã bán chưa?
        address soldBy;         // Đại lý nào bán?
        uint256 soldAt;         // Thời gian bán
        string customerInfoHash; // Hash thông tin khách hàng (SĐT/Tên/Địa chỉ)
    }

    // B. BATCH (Lô hàng - Chứa nhiều sản phẩm)
    struct Batch {
        uint256 batchCode;      // Mã lô duy nhất do người dùng nhập (VD: 101, 102)
        string name;            // Tên thuốc (VD: Panadol Extra)
        string manufacturer;    // Tên nhà máy
        uint256 createdDate;
        address currentOwner;   // Ai đang giữ lô hàng này? (Nhà máy -> Kho -> Đại lý)
        address creator;        // Người tạo ra lô hàng (Admin/Nhà máy)
        string[] productUids;   // Danh sách các ID sản phẩm con trong lô này
        string[] documentUrls;  // DANH SÁCH GIẤY TỜ THUỐC (Ảnh/PDF)
        uint256 status;         // 0: Produced, 1: QualityVerified, 2: InTransit, 3: Delivered
        bool isExists;          // Kiểm tra lô có tồn tại không
    }

    struct TimelineEvent {
        string description;
        uint256 timestamp;
        address actor;
    }

    // --- 2. LƯU TRỮ (STATE VARIABLES) ---

    // Mapping lưu trữ Lô hàng: BatchCode uint256 => Info
    mapping(uint256 => Batch) public batches;
    uint256[] public allBatchCodes; // Danh sách tất cả mã lô để duyệt qua

    // Mapping lưu trữ Timeline: BatchCode => Events
    mapping(uint256 => TimelineEvent[]) public batchTimelines;

    // Mapping lưu trữ Sản phẩm: UID string => Info
    mapping(string => Product) public products;

    // Danh sách Đại lý được ủy quyền (Chỉ những người này mới được gọi hàm bán)
    mapping(address => bool) public authorizedDealers;
    
    address public admin; // Admin hệ thống (Thường là Nhà máy sản xuất)

    // --- 3. EVENTS (LOGGING) ---
    event BatchCreated(uint256 indexed batchCode, string name, address indexed owner);
    event BatchTransferred(uint256 indexed batchCode, address from, address to);
    event ProductAdded(uint256 indexed batchCode, string uid, bytes32 secretHash);
    event ProductSold(string indexed uid, address indexed dealer, uint256 time);

    // --- 4. MODIFIERS ---
    
    modifier onlyAdmin() {
        require(msg.sender == admin, unicode"Chỉ Admin mới được thực hiện");
        _;
    }

    modifier onlyDealer() {
        require(authorizedDealers[msg.sender], unicode"Bạn không phải đại lý ủy quyền");
        _;
    }

    modifier onlyBatchOwner(uint256 _batchCode) {
        require(
            batches[_batchCode].currentOwner == msg.sender || 
            batches[_batchCode].creator == msg.sender ||
            msg.sender == admin, 
            unicode"Bạn không có quyền quản lý lô hàng này"
        );
        _;
    }

    constructor() {
        admin = msg.sender;
        // Mặc định Admin cũng là một Dealer để test
        authorizedDealers[msg.sender] = true;
    }

    // --- 5. CHỨC NĂNG QUẢN LÝ ĐẠI LÝ (ACCESS CONTROL) ---

    function addDealer(address _dealer) public onlyAdmin {
        authorizedDealers[_dealer] = true;
    }

    function removeDealer(address _dealer) public onlyAdmin {
        authorizedDealers[_dealer] = false;
    }

    // --- 6. CHỨC NĂNG QUẢN LÝ LÔ HÀNG (BATCH LOGIC) ---

    // Lấy tổng số lô hàng
    function batchCount() public view returns (uint256) {
        return allBatchCodes.length;
    }

    // Bước 1: Tạo lô hàng mới (Chưa có sản phẩm con)
    function createBatch(uint256 _batchCode, string memory _name, string memory _manufacturer) public returns (uint256) {
        require(_batchCode > 0, unicode"Mã lô phải lớn hơn 0");
        require(bytes(_name).length > 0, unicode"Tên thuốc không được để trống");
        require(bytes(_manufacturer).length > 0, unicode"Tên nhà máy không được để trống");
        require(!batches[_batchCode].isExists, unicode"Lỗi: Mã lô này đã tồn tại trên hệ thống!");

        Batch storage b = batches[_batchCode];
        b.batchCode = _batchCode;
        b.name = _name;
        b.manufacturer = _manufacturer;
        b.createdDate = block.timestamp;
        b.currentOwner = msg.sender;
        b.creator = msg.sender;
        b.status = 0;
        b.isExists = true;

        allBatchCodes.push(_batchCode);

        batchTimelines[_batchCode].push(TimelineEvent({
            description: string(abi.encodePacked(unicode"Đã sản xuất tại nhà máy: ", _manufacturer)),
            timestamp: block.timestamp,
            actor: msg.sender
        }));

        emit BatchCreated(_batchCode, _name, msg.sender);
        return _batchCode;
    }

    // Bước 2: Thêm sản phẩm vào lô (Kèm theo Secret Hash cho từng sản phẩm)
    // _uids: Danh sách mã QR (VD: ["10-001", "10-002"])
    // _secretHashes: Danh sách Hash tương ứng (VD: [Hash("Key1"), Hash("Key2")])
    function addProductsToBatch(
        uint256 _batchCode, 
        string[] memory _uids, 
        bytes32[] memory _secretHashes
    ) public onlyBatchOwner(_batchCode) {
        require(batches[_batchCode].isExists, unicode"Lô hàng không tồn tại");
        require(_uids.length == _secretHashes.length, unicode"Dữ liệu không khớp");

        for (uint256 i = 0; i < _uids.length; i++) {
            string memory uid = _uids[i];
            
            // Đảm bảo ID chưa từng tồn tại
            require(products[uid].batchId == 0, unicode"ID sản phẩm đã tồn tại");

            // Tạo sản phẩm mới
            products[uid] = Product({
                uid: uid,
                batchId: _batchCode,        // Tham chiếu ngược về Batch
                secretHash: _secretHashes[i],// "Ổ khóa"
                isSold: false,
                soldBy: address(0),
                soldAt: 0,
                customerInfoHash: ""
            });

            // Thêm vào danh sách quản lý của Batch
            batches[_batchCode].productUids.push(uid);

            emit ProductAdded(_batchCode, uid, _secretHashes[i]);
        }
    }

    // Bước 3: Chuyển quyền sở hữu Lô hàng (Nhà máy -> Kho -> Đại lý)
    // Khi chuyển Batch, toàn bộ quyền kiểm soát vật lý các Item bên trong cũng đi theo
    function transferBatch(uint256 _batchCode, address _to, string memory _note) public {
        require(
            batches[_batchCode].currentOwner == msg.sender || 
            batches[_batchCode].creator == msg.sender || 
            msg.sender == admin, 
            unicode"Bạn không có quyền chuyển lô hàng này"
        );
        require(_to != address(0), unicode"Địa chỉ không hợp lệ");
        
        address oldOwner = batches[_batchCode].currentOwner;
        batches[_batchCode].currentOwner = _to;
        
        // Cập nhật trạng thái (Ví dụ: 2 là InTransit)
        batches[_batchCode].status = 2;

        // Thêm vào timeline
        batchTimelines[_batchCode].push(TimelineEvent({
            description: _note,
            timestamp: block.timestamp,
            actor: msg.sender
        }));

        emit BatchTransferred(_batchCode, oldOwner, _to);
    }

    // Bước 4: Kiểm định chất lượng (QC)
    function verifyQuality(uint256 _batchCode, bool _isPassed) public onlyAdmin {
        require(batches[_batchCode].isExists, unicode"Lô hàng không tồn tại");
        
        if (_isPassed) {
            batches[_batchCode].status = 1; // QualityVerified
            
            batchTimelines[_batchCode].push(TimelineEvent({
                description: unicode"Đã kiểm định chất lượng: ĐẠT CHUẨN",
                timestamp: block.timestamp,
                actor: msg.sender
            }));
        }
    }

    // Bước 5: Kết thúc lộ trình (Giao hàng thành công)
    function deliverBatch(uint256 _batchCode, string memory _note) public {
        Batch storage b = batches[_batchCode];
        require(b.isExists, unicode"Lô hàng không tồn tại");
        
        // QUYỀN ƯU TIÊN 1: Nếu là Admin tối cao thì LUÔN LUÔN ĐƯỢC PHÉP
        if (msg.sender == admin) {
            // Cho phép đi tiếp
        } else {
            // QUYỀN ƯU TIÊN 2: Nếu là người tạo hoặc người giữ hàng
            require(b.creator == msg.sender || b.currentOwner == msg.sender, unicode"Bạn không có quyền kết thúc lô hàng này");
        }
        
        b.status = 3; // Delivered (Đã giao hàng)

        batchTimelines[_batchCode].push(TimelineEvent({
            description: _note,
            timestamp: block.timestamp,
            actor: msg.sender
        }));
    }

    // Bước 6: Cập nhật giấy tờ thuốc cho lô hàng
    function updateBatchDocuments(uint256 _batchCode, string[] memory _docUrls) public onlyBatchOwner(_batchCode) {
        require(batches[_batchCode].isExists, unicode"Lô hàng không tồn tại");
        batches[_batchCode].documentUrls = _docUrls;
        
        batchTimelines[_batchCode].push(TimelineEvent({
            description: unicode"Đã cập nhật bộ hồ sơ pháp lý/giấy tờ thuốc",
            timestamp: block.timestamp,
            actor: msg.sender
        }));
    }

    // --- 7. CHỨC NĂNG BÁN HÀNG & CHỐNG GIẢ (POS LOGIC) ---

    // Hàm này được gọi bởi máy POS của Đại lý
    // _secretKey: Là chuỗi KÝ TỰ GỐC (Plain text) mà Đại lý đang giữ
    function sellProduct(string memory _uid, string memory _secretKey, string memory _customerInfoHash) public onlyDealer {
        Product storage p = products[_uid];
        
        // 1. Kiểm tra sản phẩm có tồn tại không
        require(p.batchId != 0, unicode"Sản phẩm không tồn tại trong hệ thống");

        // 2. Kiểm tra đã bán chưa
        require(!p.isSold, unicode"Sản phẩm này đã được bán trước đó!");

        // 3. KIỂM TRA BẢO MẬT (QUAN TRỌNG NHẤT)
        // Băm _secretKey gửi lên và so sánh với _secretHash đang lưu
        // Nếu khớp => Đây là Đại lý đang giữ chìa khóa thật
        require(keccak256(abi.encodePacked(_secretKey)) == p.secretHash, unicode"MÃ KÍCH HỌAT KHÔNG HỢP LỆ! Phát hiện hàng giả.");

        // 4. Cập nhật trạng thái
        p.isSold = true;
        p.soldBy = msg.sender;
        p.soldAt = block.timestamp;
        p.customerInfoHash = _customerInfoHash;

        emit ProductSold(_uid, msg.sender, block.timestamp);
    }

    // --- 8. VIEW FUNCTIONS (CHO FRONTEND) ---

    // Lấy thông tin chi tiết lô hàng
    function getBatchDetails(uint256 _batchCode) public view returns (
        string memory name,
        string memory manufacturer,
        address currentOwner,
        address creator,
        uint256 status
    ) {
        Batch memory b = batches[_batchCode];
        require(b.isExists, unicode"Lô hàng không tồn tại");
        return (b.name, b.manufacturer, b.currentOwner, b.creator, b.status);
    }

    // Lấy lịch sử hành trình lô hàng
    function getBatchTimeline(uint256 _batchCode) public view returns (TimelineEvent[] memory) {
        return batchTimelines[_batchCode];
    }

    // Lấy danh sách giấy tờ thuốc
    function getBatchDocuments(uint256 _batchCode) public view returns (string[] memory) {
        return batches[_batchCode].documentUrls;
    }

    // Kiểm tra trạng thái sản phẩm (Cho người dùng quét QR)
    function checkProductStatus(string memory _uid) public view returns (
        bool isValid, 
        string memory batchName, 
        bool isSold, 
        uint256 soldAt, 
        address soldBy
    ) {
        Product memory p = products[_uid];
        if (p.batchId == 0) {
            return (false, "", false, 0, address(0)); // Không tồn tại
        }
        
        string memory bName = batches[p.batchId].name;
        return (true, bName, p.isSold, p.soldAt, p.soldBy);
    }
}