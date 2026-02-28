import React, { createContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/constants';

export const Web3Context = createContext();

const { ethereum } = window;

export const Web3Provider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Khởi tạo kết nối "Chế độ Khách" (Read-Only) ngay khi vào web
  const initReadOnlyContract = async () => {
    try {
      // Dùng RPC công cộng của mạng Sepolia (Không cần ví MetaMask)
      // Đây là cổng giúp người thường "nhìn" vào Blockchain
      const rpcUrl = "https://ethereum-sepolia-rpc.publicnode.com";
      
      // Sử dụng JsonRpcProvider trực tiếp từ ethers thay vì phụ thuộc window.ethereum
      const readProvider = new ethers.JsonRpcProvider(rpcUrl);
      
      const readContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readProvider);
      setContract(readContract);
      console.log("Đã khởi tạo chế độ Xem (Read-Only) ổn định");
    } catch (error) {
      console.error("Lỗi khởi tạo Read-Only:", error);
      // Nếu RPC bị lỗi, thử lại sau 3 giây
      setTimeout(initReadOnlyContract, 3000);
    }
  };

  // 2. Kiểm tra ví (Nếu đã kết nối thì nâng cấp lên chế độ Ghi)
  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) return;
      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);
        connectContractWithSigner(); // Nâng cấp quyền
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 3. Hàm kết nối ví (Thủ công)
  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Vui lòng cài đặt MetaMask!");
      setIsLoading(true);
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      setCurrentAccount(accounts[0]);
      connectContractWithSigner(); // Nâng cấp quyền
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  // 4. Hàm nâng cấp Contract để có quyền Ghi (Write)
  const connectContractWithSigner = async () => {
    try {
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        const writeContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(writeContract); // Ghi đè contract cũ bằng contract "xịn" hơn
        localStorage.setItem('isWalletConnected', 'true');
    } catch (error) {
        console.log("Lỗi nạp Signer:", error);
    }
  }

  // 5. Hàm ngắt ví
  const disconnectWallet = () => {
    setCurrentAccount('');
    // Khi đăng xuất, quay về chế độ Read-Only thay vì null
    localStorage.setItem('isWalletConnected', 'false');
    initReadOnlyContract();
  };

  useEffect(() => {
    try {
      initReadOnlyContract();
      const shouldAutoConnect = localStorage.getItem('isWalletConnected') === 'true';
      if (shouldAutoConnect) {
        checkIfWalletIsConnected();
      }
    } catch (error) {
      console.error("Error in Web3Context useEffect:", error);
    }
  }, []);

  return (
    <Web3Context.Provider value={{ 
      connectWallet, 
      disconnectWallet, 
      currentAccount, 
      contract, // Biến này giờ luôn có giá trị (Read hoặc Write)
      isLoading 
    }}>
      {children}
    </Web3Context.Provider>
  );
};