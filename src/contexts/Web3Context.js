"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import * as ethers from "ethers";
import {
  VERIFACT_ABI,
  VERIFACT_CONTRACT_ADDRESS,
} from "@/lib/web3/contracts/VeriFactABI";

const Web3Context = createContext();

// Hook สำหรับใช้งาน Web3Context
export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}

export function Web3Provider({ children }) {
  const [provider, setProvider] = useState(null);
  const [ethersProvider, setEthersProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [verifactContract, setVerifactContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // ตรวจสอบสถานะการเชื่อมต่อจาก localStorage
  const [persistentConnection, setPersistentConnection] = useState(false);

  // ฟังก์ชันสำหรับย่อ address
  const formatAddress = (address) => {
    if (!address) return "";
    const addressStr = String(address);
    if (addressStr.length < 10) return addressStr;
    return `${addressStr.slice(0, 6)}...${addressStr.slice(-4)}`;
  };

  // ฟังก์ชันตรวจสอบว่ามี MetaMask หรือไม่
  const checkIfWalletIsInstalled = useCallback(() => {
    if (typeof window !== "undefined") {
      return !!window.ethereum;
    }
    return false;
  }, []);

  // ฟังก์ชันเชื่อมต่อกระเป๋าเงิน
  const connectWallet = useCallback(async () => {
    try {
      console.log("กำลังเชื่อมต่อกระเป๋าเงิน...");
      setLoading(true);
      setError(null);

      // ตรวจสอบว่ามี MetaMask หรือไม่
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("ไม่พบ MetaMask กรุณาติดตั้งก่อนใช้งาน");
      }

      // ขอสิทธิ์เข้าถึงบัญชี
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        console.log("บัญชีที่ได้:", accounts);

        if (!accounts || accounts.length === 0) {
          throw new Error("ไม่สามารถเข้าถึงบัญชีได้");
        }

        // แปลง address ให้เป็น string
        const accountAddress = String(accounts[0]);

        // สร้าง provider (ethers v6)
        try {
          const ethProvider = new ethers.BrowserProvider(window.ethereum);

          // สร้าง signer
          const signer = await ethProvider.getSigner();

          // ดึงข้อมูลเครือข่าย
          const network = await ethProvider.getNetwork();
          const chainIdValue = Number(network.chainId);

          console.log("เชื่อมต่อสำเร็จ:", {
            account: accountAddress,
            chainId: chainIdValue,
          });

          // บันทึกข้อมูล
          setProvider(window.ethereum);
          setEthersProvider(ethProvider);
          setSigner(signer);
          setAccount(accountAddress);
          setIsConnected(true);
          setChainId(chainIdValue);

          // บันทึกสถานะการเชื่อมต่อลง localStorage
          localStorage.setItem("walletConnected", "true");
          setPersistentConnection(true);

          // สร้าง contract instance
          if (VERIFACT_CONTRACT_ADDRESS) {
            try {
              console.log("กำลังสร้าง contract instance");
              const contract = new ethers.Contract(
                VERIFACT_CONTRACT_ADDRESS,
                VERIFACT_ABI,
                signer
              );
              setVerifactContract(contract);

              // ตรวจสอบว่าผู้ใช้เป็น admin หรือไม่
              try {
                const adminAddress = await contract.admin();
                // แปลงให้เป็น string ก่อนเปรียบเทียบ
                const adminAddressStr = String(adminAddress);
                const accountAddressStr = String(accountAddress);

                setIsAdmin(
                  accountAddressStr.toLowerCase() ===
                    adminAddressStr.toLowerCase()
                );
              } catch (adminError) {
                console.error("Error checking admin status:", adminError);
              }
            } catch (contractError) {
              console.error("Error creating contract instance:", contractError);
            }
          }

          return accountAddress;
        } catch (error) {
          console.error("Error initializing ethers:", error);
          throw error;
        }
      } catch (requestError) {
        // จัดการกรณี user rejected request
        if (requestError.code === 4001) {
          console.log("ผู้ใช้ยกเลิกการเชื่อมต่อ");
          throw new Error("ผู้ใช้ยกเลิกการเชื่อมต่อกับ wallet");
        }
        console.error("Error requesting accounts:", requestError);
        throw requestError;
      }
    } catch (error) {
      console.error("Wallet connection error:", error);

      // ให้ข้อความที่เหมาะสมกับข้อผิดพลาด
      let errorMessage = "ไม่สามารถเชื่อมต่อกระเป๋าเงินได้";

      if (error) {
        if (
          error.code === 4001 ||
          (error.message &&
            (error.message.includes("ผู้ใช้ยกเลิก") ||
              error.message.includes("User denied") ||
              error.message.includes("user rejected")))
        ) {
          errorMessage = "ผู้ใช้ยกเลิกการเชื่อมต่อ";
        } else if (
          error.message &&
          error.message.includes("Already processing")
        ) {
          errorMessage = "กำลังประมวลผลการเชื่อมต่ออยู่ โปรดรอสักครู่";
        }
      }

      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ฟังก์ชันตัดการเชื่อมต่อกระเป๋าเงิน
  const disconnectWallet = useCallback(() => {
    try {
      console.log("กำลังตัดการเชื่อมต่อกระเป๋าเงิน...");

      // ล้างค่าใน localStorage
      localStorage.removeItem("walletConnected");
      setPersistentConnection(false);

      // รีเซ็ตสถานะ
      setAccount(null);
      setChainId(null);
      setIsConnected(false);
      setProvider(null);
      setEthersProvider(null);
      setSigner(null);
      setVerifactContract(null);
      setIsAdmin(false);

      console.log("ตัดการเชื่อมต่อเรียบร้อย");
      return true;
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      return false;
    }
  }, []);

  // ตรวจสอบการเชื่อมต่อเมื่อโหลดหน้า
  useEffect(() => {
    const checkPreviousConnection = async () => {
      if (typeof window !== "undefined") {
        const wasConnected = localStorage.getItem("walletConnected") === "true";
        setPersistentConnection(wasConnected);

        if (wasConnected && window.ethereum) {
          try {
            // ตรวจสอบบัญชีที่เชื่อมต่อ
            const accounts = await window.ethereum.request({
              method: "eth_accounts",
            });
            if (accounts && accounts.length > 0) {
              console.log("พบการเชื่อมต่อก่อนหน้า, กำลังเชื่อมต่อใหม่...");
              connectWallet();
            } else {
              // ไม่พบบัญชีที่เชื่อมต่อ ล้างสถานะการเชื่อมต่อ
              localStorage.removeItem("walletConnected");
              setPersistentConnection(false);
              setLoading(false);
            }
          } catch (error) {
            console.error("Error checking previous connection:", error);
            localStorage.removeItem("walletConnected");
            setPersistentConnection(false);
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkPreviousConnection();
  }, [connectWallet]);

  // ตั้งค่า event listener
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum && isConnected) {
      // จัดการเมื่อเปลี่ยนบัญชี
      const handleAccountsChanged = async (accounts) => {
        console.log("บัญชีเปลี่ยนแปลง:", accounts);
        if (accounts && accounts.length > 0) {
          // แปลง address ให้เป็น string
          const accountAddress = String(accounts[0]);
          setAccount(accountAddress);
          setIsConnected(true);

          // อัปเดต signer เมื่อบัญชีเปลี่ยน
          if (ethersProvider) {
            try {
              const newSigner = await ethersProvider.getSigner();
              setSigner(newSigner);

              // อัปเดต contract ด้วย signer ใหม่
              if (VERIFACT_CONTRACT_ADDRESS) {
                const contract = new ethers.Contract(
                  VERIFACT_CONTRACT_ADDRESS,
                  VERIFACT_ABI,
                  newSigner
                );
                setVerifactContract(contract);

                // ตรวจสอบ admin status
                try {
                  const adminAddress = await contract.admin();
                  // แปลงให้เป็น string ก่อนเปรียบเทียบ
                  const adminAddressStr = String(adminAddress);
                  const accountAddressStr = String(accountAddress);

                  setIsAdmin(
                    accountAddressStr.toLowerCase() ===
                      adminAddressStr.toLowerCase()
                  );
                } catch (error) {
                  console.error("Error checking admin status:", error);
                }
              }
            } catch (error) {
              console.error("Error updating signer:", error);
            }
          }
        } else {
          // หากไม่มีบัญชี (เช่น disconnected)
          setAccount(null);
          setIsConnected(false);
          setIsAdmin(false);
          localStorage.removeItem("walletConnected");
          setPersistentConnection(false);
        }
      };

      // จัดการเมื่อเปลี่ยนเครือข่าย
      const handleChainChanged = (_chainId) => {
        console.log("เครือข่ายเปลี่ยนแปลง:", _chainId);
        window.location.reload();
      };

      // จัดการเมื่อตัดการเชื่อมต่อ
      const handleDisconnect = (error) => {
        console.log("เกิดเหตุการณ์ตัดการเชื่อมต่อ:", error);
        disconnectWallet();
        localStorage.removeItem("walletConnected");
        setPersistentConnection(false);
      };

      // เพิ่ม event listeners
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("disconnect", handleDisconnect);

      // Cleanup function
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener(
            "accountsChanged",
            handleAccountsChanged
          );
          window.ethereum.removeListener("chainChanged", handleChainChanged);
          window.ethereum.removeListener("disconnect", handleDisconnect);
        }
      };
    }
  }, [ethersProvider, isConnected, disconnectWallet]);

  // ฟังก์ชันเปลี่ยนเครือข่าย
  const switchNetwork = useCallback(async (targetChainId) => {
    if (!window.ethereum) return false;

    try {
      // แปลงเป็นเลขฐานสิบหก
      const chainIdHex = `0x${targetChainId.toString(16)}`;

      try {
        // สลับไปยังเครือข่ายที่ต้องการ
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainIdHex }],
        });
        return true;
      } catch (switchError) {
        // ถ้าเครือข่ายไม่มีในรายการ
        if (switchError.code === 4902) {
          console.log("ต้องเพิ่มเครือข่ายก่อน");
          return false;
        }
        throw switchError;
      }
    } catch (error) {
      console.error("Error switching network:", error);
      return false;
    }
  }, []);

  // ฟังก์ชันสำหรับเรียกข้อมูลจาก contract
  const callContractMethod = useCallback(
    async (methodName, ...args) => {
      if (!verifactContract) {
        console.error(`Cannot call ${methodName}: contract not initialized`);
        return null;
      }

      try {
        // เรียกเมธอดของ contract
        const result = await verifactContract[methodName](...args);
        return result;
      } catch (error) {
        console.error(`Error calling ${methodName}:`, error);
        return null;
      }
    },
    [verifactContract]
  );

  // ฟังก์ชันตรวจสอบสินค้า
  const verifyProduct = useCallback(
    async (productId) => {
      return callContractMethod("verifyProduct", productId);
    },
    [callContractMethod]
  );

  // ฟังก์ชันลงทะเบียนสินค้า
  const registerProduct = useCallback(
    async (details, initialPrice) => {
      if (!verifactContract || !account) return null;
      try {
        const result = await verifactContract.registerProduct(
          details,
          initialPrice
        );
        if (result.wait) {
          await result.wait(); // ethers.js v6
        }
        return result;
      } catch (error) {
        console.error("Error registering product:", error);
        throw error;
      }
    },
    [verifactContract, account]
  );

  // ฟังก์ชันโอนสินค้า
  const transferProduct = useCallback(
    async (productId, newOwner, price) => {
      if (!verifactContract || !account) return null;
      try {
        const result = await verifactContract.transferProduct(
          productId,
          newOwner,
          price
        );
        if (result.wait) {
          await result.wait(); // ethers.js v6
        }
        return result;
      } catch (error) {
        console.error("Error transferring product:", error);
        throw error;
      }
    },
    [verifactContract, account]
  );

  // ฟังก์ชันเปลี่ยนแอดมิน (เฉพาะแอดมินเท่านั้น)
  const transferAdmin = useCallback(
    async (newAdmin) => {
      if (!verifactContract || !account || !isAdmin) return null;
      try {
        const result = await verifactContract.transferAdmin(newAdmin);
        if (result.wait) {
          await result.wait(); // ethers.js v6
        }
        return result;
      } catch (error) {
        console.error("Error transferring admin:", error);
        throw error;
      }
    },
    [verifactContract, account, isAdmin]
  );

  // ฟังก์ชันดึงข้อมูลสินค้า
  const getProduct = useCallback(
    async (productId) => {
      return callContractMethod("getProduct", productId);
    },
    [callContractMethod]
  );

  // ฟังก์ชันดึงสินค้าของเจ้าของ
  const getProductsByOwner = useCallback(
    async (owner) => {
      return callContractMethod("getProductsByOwner", owner || account);
    },
    [callContractMethod, account]
  );

  // ฟังก์ชันดึงประวัติการโอน
  const getTransferHistory = useCallback(
    async (productId) => {
      return callContractMethod("getTransferHistory", productId);
    },
    [callContractMethod]
  );

  const checkIsAdmin = async () => {
    if (!verifactContract || !account) return false;

    try {
      const adminAddress = await verifactContract.methods.admin().call();
      return account.toLowerCase() === adminAddress.toLowerCase();
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  };

  // web3.js compatibility methods
  // สร้างออบเจกต์ที่มีเมธอดแบบเดียวกับ web3.js เพื่อความเข้ากันได้
  const createContractMethodsCompatibility = useCallback(() => {
    if (!verifactContract) return {};

    // สร้างออบเจกต์ methods ที่มีเมธอดแบบเดียวกับ web3.js
    const methods = {};

    // เพิ่มเมธอดทุกตัวใน ABI
    VERIFACT_ABI.forEach((item) => {
      if (item.type === "function") {
        const methodName = item.name;

        // สร้างเมธอดที่เรียกใช้ contract
        methods[methodName] = (...args) => {
          // สร้างออบเจกต์ที่มีเมธอด call และ send เหมือน web3.js
          return {
            call: async (options = {}) => {
              try {
                return await verifactContract[methodName](...args);
              } catch (error) {
                console.error(`Error calling ${methodName}:`, error);
                throw error;
              }
            },
            send: async (options = {}) => {
              try {
                const result = await verifactContract[methodName](...args);
                if (result.wait) {
                  await result.wait();
                }
                return result;
              } catch (error) {
                console.error(`Error sending ${methodName}:`, error);
                throw error;
              }
            },
          };
        };
      }
    });

    return methods;
  }, [verifactContract]);

  const setSuccessor = useCallback(
    async (productId, successorAddress) => {
      if (!verifactContract || !account) return null;
      try {
        const result = await verifactContract.methods
          .setSuccessor(productId, successorAddress)
          .send({ from: account });
        return result;
      } catch (error) {
        console.error("Error setting successor:", error);
        throw error;
      }
    },
    [verifactContract, account]
  );

  const requestSuccession = useCallback(
    async (productId) => {
      if (!verifactContract || !account) return null;
      try {
        const result = await verifactContract.methods
          .requestSuccession(productId)
          .send({ from: account });
        return result;
      } catch (error) {
        console.error("Error requesting succession:", error);
        throw error;
      }
    },
    [verifactContract, account]
  );

  const approveSuccession = useCallback(
    async (productId, successorAddress, price = 0) => {
      if (!verifactContract || !account) return null;
      try {
        const result = await verifactContract.methods
          .approveSuccession(productId, successorAddress, price)
          .send({ from: account });
        return result;
      } catch (error) {
        console.error("Error approving succession:", error);
        throw error;
      }
    },
    [verifactContract, account]
  );

  // ค่าที่จะส่งไปยัง Provider
  const value = {
    provider,
    ethersProvider,
    signer,
    account,
    chainId,
    isConnected,
    isAdmin,
    verifactContract: verifactContract
      ? {
          ...verifactContract,
          methods: createContractMethodsCompatibility(),
        }
      : null,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    verifyProduct,
    registerProduct,
    transferProduct,
    transferAdmin,
    getProduct,
    getProductsByOwner,
    getTransferHistory,
    checkIfWalletIsInstalled,
    switchNetwork,
    formatAddress,
    persistentConnection,
    checkIsAdmin,
    setSuccessor,
    requestSuccession,
    approveSuccession,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}
