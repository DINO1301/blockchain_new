import React, { useState, useContext } from "react";
import { Web3Context } from "../../context/Web3Context";
import {
    ShieldCheck,
    Search,
    Loader2,
    TestTube2,
    AlertTriangle,
} from "lucide-react";

const QualityControl = () => {
    const { contract, currentAccount } = useContext(Web3Context);

    const [batchId, setBatchId] = useState("");
    const [batchData, setBatchData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);

    // 1. Tìm lô thuốc cần kiểm định
    const handleCheck = async (e) => {
        e.preventDefault();
        if (!contract || !batchId) return;

        setLoading(true);
        setBatchData(null);
        try {
            const details = await contract.getBatchDetails(batchId);
            // details: [name, manufName, currentOwner, status]
            let b_id = details[0] === "" ? null : details[0];

            setBatchData({
                id: b_id,
                name: details[0],
                manufacturer: details[1],
                status: Number(details[3]),
            });
            console.log(b_id);
        } catch (err) {
            console.error(err);
            alert("Không tìm thấy lô thuốc này!");
        } finally {
            setLoading(false);
        }
    };
    // 2. Xác nhận Đạt chuẩn (Ghi vào Blockchain)
    const handleVerify = async () => {
        if (!contract) return;
        
        if (!currentAccount) {
            return alert("⚠️ Vui lòng kết nối ví MetaMask để thực hiện giao dịch này!");
        }

        setVerifying(true);
        try {
            // Gọi hàm verifyQuality(id, true) trong Smart Contract
            const tx = await contract.verifyQuality(batchId, true);
            console.log("Đang xác thực...", tx.hash);

            await tx.wait();

            alert("✅ Đã xác nhận kiểm định chất lượng thành công!");
            setBatchData(null);
            setBatchId("");
        } catch (err) {
            console.error(err);
            alert("Lỗi: " + (err.reason || err.message));
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8 border-b pb-4">
                    <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                        <TestTube2 size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Kiểm Định Chất Lượng
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Dành cho phòng thí nghiệm / Cơ quan chức năng
                        </p>
                    </div>
                </div>

                {/* Bước 1: Nhập ID */}
                <form onSubmit={handleCheck} className="flex gap-2 mb-8">
                    <input
                        type="number"
                        placeholder="Nhập ID lô thuốc cần kiểm tra"
                        className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
                        value={batchId}
                        onChange={(e) => setBatchId(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-gray-800 text-white px-6 rounded-lg font-medium hover:bg-black transition"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <Search size={20} />
                        )}
                    </button>
                </form>

                {/* Bước 2: Hiển thị thông tin & Nút duyệt */}
                {batchData && (
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 animate-in fade-in slide-in-from-bottom-2">
                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                            {batchData.name}
                        </h3>
                        <p className="text-gray-500 text-sm mb-4">
                            Sản xuất bởi: {batchData.manufacturer}
                        </p>

                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-sm font-semibold text-gray-600">
                                Trạng thái hiện tại:
                            </span>
                            {batchData.status === 1 ? ( // 1 = QualityVerified (tùy enum trong solidity)
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold flex items-center gap-1">
                                    <ShieldCheck size={12} /> Đã kiểm định
                                </span>
                            ) : (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-bold flex items-center gap-1">
                                    <AlertTriangle size={12} /> Chưa kiểm định
                                </span>
                            )}
                        </div>

                        {/* Chỉ hiện nút duyệt nếu chưa kiểm định */}
                        {batchData.status !== 1 && (
                            <button
                                onClick={handleVerify}
                                disabled={verifying}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-purple-200"
                            >
                                {verifying ? (
                                    <>
                                        <Loader2 className="animate-spin" />{" "}
                                        Đang ghi Blockchain...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck /> Xác nhận ĐẠT CHUẨN
                                    </>
                                )}
                            </button>
                        )}

                        {batchData.status === 1 && (
                            <p className="text-center text-green-600 font-medium">
                                Lô thuốc này đã đạt chuẩn QC.
                            </p>
                        )}
                    </div>
                )}

                {!currentAccount && (
                    <p className="mt-4 text-center text-red-500 text-sm">
                        ⚠️ Vui lòng kết nối ví để thực hiện thao tác này
                    </p>
                )}
            </div>
        </div>
    );
};

export default QualityControl;
