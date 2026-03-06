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
    const rpcUrls = [
      "https://ethereum-sepolia-rpc.publicnode.com",
      "https://eth-sepolia.public.blastapi.io"
    ];

    for (const url of rpcUrls) {
      try {
        // Sepolia Chain ID: 11155111 - staticNetwork: true để bỏ qua bước nhận diện tự động
        const readProvider = new ethers.JsonRpcProvider(url, 11155111, { staticNetwork: true });
        const readContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readProvider);
        
        // CHỈ setContract nếu chưa có currentAccount (tránh ghi đè bản Write-mode)
        setContract(prev => {
          if (prev && prev.runner && typeof prev.runner.sendTransaction === 'function') return prev;
          return readContract;
        });
        
        console.log(`Đã kết nối Blockchain (Read-only) qua: ${url} (Sepolia 11155111)`);
        return; // Thoát nếu kết nối thành công
      } catch (error) {
        console.warn(`RPC ${url} chậm hoặc lỗi:`, error.message);
      }
    }
  };

  // 2. Kiểm tra ví (Nếu đã kết nối thì nâng cấp lên chế độ Ghi)
  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) return;
      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);
        await connectContractWithSigner(); // Nâng cấp quyền
      }
    } catch (error) {
      console.error("Lỗi kiểm tra ví:", error);
    }
  };

  // 3. Hàm kết nối ví (Thủ công)
  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Vui lòng cài đặt MetaMask!");
      setIsLoading(true);
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length > 0) {
        setCurrentAccount(accounts[0]);
        await connectContractWithSigner(); // Nâng cấp quyền
        localStorage.setItem('isWalletConnected', 'true');
      }
    } catch (error) {
      console.error("Lỗi kết nối ví:", error);
      if (error.code !== 4001) { // 4001 là lỗi người dùng từ chối
        alert("Lỗi kết nối ví: " + (error.message || "Không rõ lỗi"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Hàm nâng cấp Contract để có quyền Ghi (Write)
  const connectContractWithSigner = async () => {
    try {
        const provider = new ethers.BrowserProvider(ethereum);
        const network = await provider.getNetwork();
        const expectedChainId = 11155111n;
        if (network.chainId !== expectedChainId) {
            try {
                await ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0xaa36a7' }]
                });
            } catch (switchError) {
                throw new Error('Ví chưa ở mạng Sepolia. Vui lòng chuyển mạng sang Sepolia để tiếp tục.');
            }
        }
        const finalProvider = new ethers.BrowserProvider(ethereum);
        const code = await finalProvider.getCode(CONTRACT_ADDRESS);
        if (!code || code === '0x') {
            throw new Error('Địa chỉ hợp đồng không có code trên mạng hiện tại. Cần cập nhật CONTRACT_ADDRESS.');
        }
        const signer = await finalProvider.getSigner();
        const writeContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(writeContract);
    } catch (error) {
        console.error("Lỗi nạp Signer:", error);
        // Nếu lỗi nạp Signer, quay về Read-only
        initReadOnlyContract();
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
    const init = async () => {
      // Chạy song song thay vì tuần tự để tránh treo
      initReadOnlyContract();
      
      const shouldAutoConnect = localStorage.getItem('isWalletConnected') === 'true';
      if (shouldAutoConnect) {
        checkIfWalletIsConnected();
      }
    };
    init();

    if (ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);
          connectContractWithSigner();
        } else {
          disconnectWallet();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      };
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
