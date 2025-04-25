// src/app/seller/dashboard/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useWeb3 } from "@/contexts/Web3Context";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import Image from "next/image";
import TransferProductModal from "@/components/ui/TransferProductModal";
import { formatDate } from "@/utils/format";

export default function SellerDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [products, setProducts] = useState([]);
  const [soldProducts, setSoldProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    productName: "",
    productModel: "",
    serialNumber: "",
    initialPrice: "",
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const [showFullWallet, setShowFullWallet] = useState(false);
  const [selectedProductForTransfer, setSelectedProductForTransfer] =
    useState(null);
  const [activeTab, setActiveTab] = useState("current"); // สถานะแท็บที่กำลังแสดง: "current" หรือ "sold"

  const {
    verifactContract,
    account,
    isConnected,
    connectWallet,
    disconnectWallet,
  } = useWeb3();
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const router = useRouter();
  const profileMenuRef = useRef(null);

  // ตรวจสอบว่าผู้ใช้เป็นแอดมินหรือไม่
  useEffect(() => {
    const checkPermissions = async () => {
      if (!verifactContract || !account) return;

      try {
        // ตรวจสอบว่าเป็น admin หรือไม่
        const adminAddress = await verifactContract.methods.admin().call();
        const isUserAdmin =
          account.toLowerCase() === adminAddress.toLowerCase();

        // ตรวจสอบว่าเป็น seller หรือไม่
        const isUserSeller = await verifactContract.methods
          .isSeller(account)
          .call();

        setIsAdmin(isUserAdmin);
        setIsSeller(isUserSeller); // เพิ่มบรรทัดนี้

        // อนุญาตให้เข้าถึงหน้านี้ได้ทั้ง admin และ seller
        if (!isUserAdmin && !isUserSeller) {
          showError("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
          router.push("/");
        } else {
          fetchAllProducts(); // เรียก function นี้แทน fetchProducts
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
        showError("เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์");
      }
    };

    if (isConnected) {
      checkPermissions();
    }
  }, [verifactContract, account, isConnected, router]);

  // ฟังก์ชันสำหรับดึงข้อมูลสินค้าทั้งหมด (ทั้งที่มีอยู่และที่ขายไปแล้ว)
  const fetchAllProducts = async () => {
    if (!verifactContract || !account) return;

    try {
      setIsLoading(true);

      // ดึงรายการรหัสสินค้าทั้งหมด
      const allProductIds = await verifactContract.methods
        .getAllProductIds()
        .call();

      // ดึงรายการรหัสสินค้าที่เป็นเจ้าของในปัจจุบัน
      const ownedProductIds = await verifactContract.methods
        .getProductsByOwner(account)
        .call();

      // ดึงรายการสินค้าที่ลงทะเบียนโดยผู้ขายนี้
      const registeredProductIds = await verifactContract.methods
        .getProductsRegisteredBySeller(account)
        .call();

      console.log("ownedProductIds:", ownedProductIds);
      console.log("registeredProductIds:", registeredProductIds);

      // 1. ดึงข้อมูลสินค้าที่มีอยู่ปัจจุบัน
      const currentProductsData = await Promise.all(
        ownedProductIds.map(async (id) => {
          const product = await verifactContract.methods.getProduct(id).call();
          return {
            productId: product.productId || id,
            details: product.details || "ไม่มีรายละเอียด",
            initialPrice: product.initialPrice?.toString() || "0",
            currentOwner: product.currentOwner || "ไม่ระบุเจ้าของ",
            createdAt: product.createdAt?.toString() || "0",
            isActive: product.isActive || false,
            designatedSuccessor: product.designatedSuccessor || null,
            isRegisteredBySeller: registeredProductIds.includes(id),
          };
        })
      );

      // 2. ดึงข้อมูลสินค้าที่ขายไปแล้ว (ลงทะเบียนโดยผู้ขายนี้แต่ไม่ได้เป็นเจ้าของปัจจุบัน)
      const soldProductItems = [];

      // กรองเฉพาะสินค้าที่ลงทะเบียนโดยผู้ขายนี้แต่ไม่ได้เป็นเจ้าของปัจจุบัน
      for (const id of registeredProductIds) {
        if (!ownedProductIds.includes(id)) {
          try {
            // ดึงข้อมูลสินค้า
            const product = await verifactContract.methods
              .getProduct(id)
              .call();

            // ดึงประวัติการโอน
            const transferHistory = await verifactContract.methods
              .getTransferHistory(id)
              .call();

            // หารายการโอนล่าสุดที่ผู้ขายเป็นผู้โอน
            const lastTransferFromSeller = transferHistory
              .filter(
                (transfer) =>
                  transfer.from.toLowerCase() === account.toLowerCase()
              )
              .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))[0];

            if (lastTransferFromSeller) {
              soldProductItems.push({
                productId: product.productId || id,
                details: product.details || "ไม่มีรายละเอียด",
                initialPrice: product.initialPrice?.toString() || "0",
                currentOwner: product.currentOwner || "ไม่ระบุเจ้าของ",
                createdAt: product.createdAt?.toString() || "0",
                isActive: product.isActive || false,
                soldTo: lastTransferFromSeller.to,
                soldAt: lastTransferFromSeller.timestamp,
                soldPrice: lastTransferFromSeller.price,
                profit:
                  Number(lastTransferFromSeller.price) -
                  Number(product.initialPrice),
              });
            }
          } catch (err) {
            console.error(`Error fetching sold product ${id}:`, err);
          }
        }
      }

      // เรียงลำดับสินค้าที่ขายไปแล้วตามวันที่ขายล่าสุด
      soldProductItems.sort((a, b) => Number(b.soldAt) - Number(a.soldAt));

      console.log("Current Products:", currentProductsData);
      console.log("Sold Products:", soldProductItems);

      setProducts(currentProductsData);
      setSoldProducts(soldProductItems);
    } catch (error) {
      console.error("Error fetching products:", error);
      showError("ไม่สามารถดึงข้อมูลสินค้าได้");
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันสร้างหมายเลขซีเรียลแบบสุ่ม
  const generateRandomSerialNumber = () => {
    // สร้างหมายเลขซีเรียลแบบสุ่ม 12 หลัก
    // ตัวอย่าง: SN-XXXX-XXXX-XXXX
    const randomPart1 = Math.floor(1000 + Math.random() * 9000);
    const randomPart2 = Math.floor(1000 + Math.random() * 9000);
    const randomPart3 = Math.floor(1000 + Math.random() * 9000);

    const serialNumber = `SN-${randomPart1}-${randomPart2}-${randomPart3}`;

    // อัพเดทค่าใน form
    setFormData((prev) => ({
      ...prev,
      serialNumber,
    }));
  };

  // จัดการการเปลี่ยนแปลงของฟอร์ม
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ลงทะเบียนสินค้าใหม่
  const handleRegisterProduct = async (e) => {
    e.preventDefault();

    // สร้าง productId อัตโนมัติ
    const productId = `PROD-${Date.now()}`;

    // รวมรายละเอียดสินค้า
    const details = `${formData.productName} | ${formData.productModel} | ${formData.serialNumber}`;

    try {
      setIsLoading(true);

      // แปลงค่า initialPrice เป็นตัวเลข
      const initialPrice = parseInt(formData.initialPrice, 10);

      // เรียกใช้ฟังก์ชัน registerProduct ใน smart contract
      const result = await verifactContract.methods
        .registerProduct(productId, details, initialPrice)
        .send({ from: account });

      console.log("Transaction result:", result);
      showSuccess(`ลงทะเบียนสินค้าสำเร็จ! รหัสสินค้า: ${productId}`);

      // รีเซ็ตฟอร์ม
      setFormData({
        productName: "",
        productModel: "",
        serialNumber: "",
        initialPrice: "",
      });

      // โหลดข้อมูลใหม่
      fetchAllProducts();
    } catch (error) {
      console.error("Error registering product:", error);
      showError(`เกิดข้อผิดพลาดในการลงทะเบียนสินค้า: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // การโอนสินค้าให้ลูกค้า
  const handleTransferToCustomer = async (productId, buyerAddress, price) => {
    try {
      setIsLoading(true);

      await verifactContract.methods
        .transferProduct(productId, buyerAddress, price)
        .send({ from: account });

      showSuccess(`โอนสินค้ารหัส ${productId} ให้กับ ${buyerAddress} สำเร็จ!`);

      fetchAllProducts();
      setSelectedProductForTransfer(null); // ปิด Modal
    } catch (error) {
      console.error("Error transferring product:", error);
      showError("เกิดข้อผิดพลาดในการโอนสินค้า");
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันสำหรับย่อที่อยู่กระเป๋าเงิน
  const truncateAddress = (address, startLength = 6, endLength = 4) => {
    if (!address) return "";
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
  };

  // ฟังก์ชันคัดลอกที่อยู่กระเป๋าเงิน
  const copyWalletAddress = () => {
    navigator.clipboard.writeText(account);
    showSuccess("คัดลอกที่อยู่กระเป๋าเงินแล้ว");
  };

  // ฟังก์ชันคำนวณสีพื้นหลังจากชื่อผู้ใช้หรืออีเมล
  const getInitialColors = () => {
    const name = user?.name || user?.email || "User";
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash % 360);
    const bgColor = `hsl(${hue}, 70%, 80%)`;
    const textColor = `hsl(${hue}, 70%, 20%)`;

    return { bgColor, textColor };
  };

  const { bgColor, textColor } = getInitialColors();

  useEffect(() => {
    // ปิดเมนูโปรไฟล์เมื่อคลิกนอกพื้นที่
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    // ยกเลิกการเชื่อมต่อกระเป๋าเงิน
    if (disconnectWallet) {
      disconnectWallet();
    }
    // ออกจากระบบ NextAuth
    await signOut({ redirect: false });
    showInfo("ออกจากระบบแล้ว");

    // นำทางไปยังหน้าแรก
    router.push("/");
  };

  // คำนวณยอดรวมกำไร
  const totalProfit = soldProducts.reduce((sum, product) => {
    return sum + (product.profit || 0);
  }, 0);

  // คำนวณยอดขายรวม
  const totalSales = soldProducts.reduce((sum, product) => {
    return sum + Number(product.soldPrice || 0);
  }, 0);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">เชื่อมต่อกระเป๋าเงิน</h2>
          <p className="text-gray-600 mb-6">
            กรุณาเชื่อมต่อกระเป๋าเงินเพื่อเข้าถึงหน้าผู้ขาย
          </p>
          <button
            onClick={connectWallet}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center mx-auto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            เชื่อมต่อกระเป๋าเงิน
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin && !isSeller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">
            ไม่มีสิทธิ์เข้าถึง
          </h2>
          <p className="text-gray-600 mb-6">
            คุณไม่มีสิทธิ์เข้าถึงหน้านี้
            เฉพาะผู้ขายหรือแอดมินเท่านั้นที่สามารถเข้าถึงได้
          </p>
          <Link
            href="/"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gray-50">
        {/* ส่วนหัว */}
        <header className="bg-white shadow-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link href="/" className="flex items-center space-x-3">
                <div className="rounded-full bg-blue-600 p-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-gray-900">
                  VeriFact <span className="text-blue-600">ผู้ขาย</span>
                </h1>
              </Link>

              <div className="flex items-center space-x-4">
                <div className="bg-gray-100 rounded-full py-1.5 px-3 flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <div className="font-mono text-sm">
                    {account?.substring(0, 6)}...
                    {account?.substring(account.length - 4)}
                  </div>
                </div>

                {/* ปุ่มไอคอนโปรไฟล์ */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="inline-flex items-center bg-blue-600 text-white justify-center w-10 h-10 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {user.image && !profileImageError ? (
                      <Image
                        src={user.image}
                        alt={user.name || "User"}
                        className="w-10 h-10 rounded-full"
                        onError={() => setProfileImageError(true)}
                      />
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="white"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    )}
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-10 overflow-hidden">
                      {/* ส่วนข้อมูล Wallet */}
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-500">
                            กระเป๋าเงิน
                          </span>
                          <button
                            onClick={() => setShowFullWallet(!showFullWallet)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            {showFullWallet ? "ซ่อน" : "แสดงทั้งหมด"}
                          </button>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                          <p className="text-sm font-mono break-all">
                            {showFullWallet
                              ? account
                              : truncateAddress(account, 8, 6)}
                          </p>
                          <button
                            onClick={copyWalletAddress}
                            className="ml-2 text-blue-500 hover:text-blue-700"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* เมนูตัวเลือก */}
                      <div className="py-1">
                        <Link
                          href="/seller/profile"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-3 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          ข้อมูลส่วนตัว
                        </Link>

                        <Link
                          href="/seller/settings"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-3 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          ตั้งค่า
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-gray-100"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-3 text-red-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          ออกจากระบบ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* ส่วนภาพรวม */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-2">สินค้าทั้งหมด</h2>
              <p className="text-3xl font-bold text-blue-600">
                {products.length + soldProducts.length}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-2">สินค้าที่พร้อมขาย</h2>
              <p className="text-3xl font-bold text-green-600">
                {products.filter((p) => p.isActive).length}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-2">สินค้าที่ระงับแล้ว</h2>
              <p className="text-3xl font-bold text-yellow-600">
                {products.filter((p) => !p.isActive).length}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-2">สินค้าที่ขายแล้ว</h2>
              <p className="text-3xl font-bold text-purple-600">
                {soldProducts.length}
              </p>
            </div>
          </div>

          {/* ส่วนแสดงข้อมูลการขาย */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">ยอดขายรวม</h2>
              <p className="text-3xl font-bold text-green-600">
                {totalSales.toLocaleString()} บาท
              </p>
              <p className="text-sm text-gray-500 mt-2">
                จากสินค้าที่ขายไปแล้วทั้งหมด {soldProducts.length} ชิ้น
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">กำไรรวม</h2>
              <p className="text-3xl font-bold text-blue-600">
                {totalProfit.toLocaleString()} บาท
              </p>
              <p className="text-sm text-gray-500 mt-2">
                กำไรเฉลี่ยต่อชิ้น:{" "}
                {soldProducts.length
                  ? Math.round(
                      totalProfit / soldProducts.length
                    ).toLocaleString()
                  : 0}{" "}
                บาท
              </p>
            </div>
          </div>

          {/* ส่วนลงทะเบียนสินค้าใหม่ */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">ลงทะเบียนสินค้าใหม่</h2>

            <form onSubmit={handleRegisterProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อสินค้า
                  </label>

                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleInputChange}
                    placeholder="ชื่อสินค้า"
                    className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รุ่น
                  </label>

                  <input
                    type="text"
                    name="productModel"
                    value={formData.productModel}
                    onChange={handleInputChange}
                    placeholder="รุ่นของสินค้า"
                    className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หมายเลขซีเรียล
                  </label>

                  <div className="flex space-x-2">
                    <input
                      type="text"
                      name="serialNumber"
                      value={formData.serialNumber}
                      onChange={handleInputChange}
                      placeholder="หมายเลขซีเรียล"
                      className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={generateRandomSerialNumber}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-md flex-shrink-0"
                      title="สร้างหมายเลขซีเรียลแบบสุ่ม"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    หมายเลขซีเรียลของสินค้า หรือกดปุ่มเพื่อสร้างอัตโนมัติ
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ราคา (บาท)
                  </label>

                  <input
                    type="number"
                    name="initialPrice"
                    value={formData.initialPrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                >
                  {isLoading ? "กำลังดำเนินการ..." : "ลงทะเบียนสินค้า"}
                </button>
              </div>
            </form>
          </div>

          {/* แท็บสำหรับเลือกดูสินค้า */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="border-b border-gray-200 mb-6">
              <div className="flex -mb-px">
                <button
                  className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "current"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => setActiveTab("current")}
                >
                  สินค้าปัจจุบัน
                </button>
                <button
                  className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "sold"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => setActiveTab("sold")}
                >
                  สินค้าที่ขายแล้ว
                </button>
              </div>
            </div>

            {/* แสดงสินค้าปัจจุบัน */}
            {activeTab === "current" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 mr-2 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    </svg>
                    รายการสินค้าปัจจุบัน
                  </h2>
                  <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    ทั้งหมด {products.length} รายการ
                  </div>
                </div>

                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
                  </div>
                ) : products.length > 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              <div className="flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1 text-gray-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                                  />
                                </svg>
                                รหัส
                              </div>
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              <div className="flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1 text-gray-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                รายละเอียด
                              </div>
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              <div className="flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1 text-gray-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                ราคา
                              </div>
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              <div className="flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1 text-gray-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                สถานะ
                              </div>
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              <div className="flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1 text-gray-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                                เจ้าของ
                              </div>
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              <div className="flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1 text-gray-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                การจัดการ
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {products.map((product, index) => (
                            <tr
                              key={`product-${product.productId || index}`}
                              className="hover:bg-gray-50 transition-colors duration-150"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                <div className="flex items-center">
                                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded mr-2">
                                    #{index + 1}
                                  </span>
                                  {product.productId || "ไม่ระบุรหัส"}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 mr-1.5 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                    />
                                  </svg>
                                  <span className="font-medium text-gray-700">
                                    {product.details || "ไม่มีรายละเอียด"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center">
                                  <span className="font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                    {product.initialPrice || "0"} บาท
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {product.isActive !== undefined ? (
                                  product.isActive ? (
                                    <span className="px-3 py-1 inline-flex items-center text-xs font-medium rounded-full bg-green-100 text-green-800">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 mr-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                      พร้อมขาย
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1 inline-flex items-center text-xs font-medium rounded-full bg-red-100 text-red-800">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 mr-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                      ไม่แอคทีฟ
                                    </span>
                                  )
                                ) : (
                                  <span className="px-3 py-1 inline-flex items-center text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 mr-1"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    ไม่ทราบสถานะ
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {product.currentOwner ? (
                                  product.currentOwner.toLowerCase() ===
                                  account?.toLowerCase() ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 mr-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                      </svg>
                                      คุณ (ผู้ขาย)
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      {`${product.currentOwner.substring(
                                        0,
                                        6
                                      )}...${product.currentOwner.substring(
                                        product.currentOwner.length - 4
                                      )}`}
                                    </span>
                                  )
                                ) : (
                                  "ไม่ระบุเจ้าของ"
                                )}
                              </td>
                              {/* ส่วนการจัดการ */}
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex space-x-2">
                                  <Link
                                    href={`/verify/${product.productId}`}
                                    className="inline-flex items-center px-2.5 py-1.5 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 mr-1"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                      />
                                    </svg>
                                    ตรวจสอบ
                                  </Link>

                                  {product.currentOwner &&
                                    product.currentOwner.toLowerCase() ===
                                      account?.toLowerCase() &&
                                    product.isActive && (
                                      <button
                                        onClick={() =>
                                          setSelectedProductForTransfer(product)
                                        }
                                        className="inline-flex items-center px-2.5 py-1.5 border border-green-300 text-xs font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100"
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-4 w-4 mr-1"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                          />
                                        </svg>
                                        ขาย
                                      </button>
                                    )}

                                  {product.isActive && (
                                    <button
                                      onClick={async () => {
                                        try {
                                          await verifactContract.methods
                                            .setProductStatus(
                                              product.productId,
                                              false
                                            )
                                            .send({ from: account });
                                          showSuccess(
                                            `ระงับสินค้ารหัส ${product.productId} สำเร็จ`
                                          );
                                          fetchAllProducts();
                                        } catch (error) {
                                          console.error(
                                            "Error disabling product:",
                                            error
                                          );
                                          showError(
                                            "เกิดข้อผิดพลาดในการระงับสินค้า"
                                          );
                                        }
                                      }}
                                      className="inline-flex items-center px-2.5 py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 mr-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                        />
                                      </svg>
                                      ระงับ
                                    </button>
                                  )}

                                  {!product.isActive && (
                                    <button
                                      onClick={async () => {
                                        try {
                                          await verifactContract.methods
                                            .setProductStatus(
                                              product.productId,
                                              true
                                            )
                                            .send({ from: account });
                                          showSuccess(
                                            `เปิดใช้งานสินค้ารหัส ${product.productId} สำเร็จ`
                                          );
                                          fetchAllProducts();
                                        } catch (error) {
                                          console.error(
                                            "Error enabling product:",
                                            error
                                          );
                                          showError(
                                            "เกิดข้อผิดพลาดในการเปิดใช้งานสินค้า"
                                          );
                                        }
                                      }}
                                      className="inline-flex items-center px-2.5 py-1.5 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 mr-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                      </svg>
                                      เปิดใช้งาน
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-10 text-center border border-dashed border-gray-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-16 w-16 mx-auto text-gray-400 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p className="text-gray-600 mb-2 font-medium">
                      ยังไม่มีสินค้าในระบบ
                    </p>
                    <p className="text-gray-500 text-sm">
                      กรุณาลงทะเบียนสินค้าใหม่โดยใช้ฟอร์มด้านบน
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* แสดงสินค้าที่ขายแล้ว */}
            {activeTab === "sold" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 mr-2 text-purple-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    รายการสินค้าที่ขายแล้ว
                  </h2>
                  <div className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                    ทั้งหมด {soldProducts.length} รายการ
                  </div>
                </div>

                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
                  </div>
                ) : soldProducts.length > 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              รหัส
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              <div className="flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1 text-gray-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                  />
                                </svg>
                                รายละเอียด
                              </div>
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              <div className="flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1 text-gray-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                ราคาต้นทุน
                              </div>
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              <div className="flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1 text-gray-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                ราคาขาย
                              </div>
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              <div className="flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1 text-gray-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                  />
                                </svg>
                                กำไร
                              </div>
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              <div className="flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1 text-gray-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                                ผู้ซื้อ
                              </div>
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              <div className="flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1 text-gray-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                วันที่ขาย
                              </div>
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              การจัดการ
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {soldProducts.map((product, index) => (
                            <tr
                              key={`sold-product-${product.productId || index}`}
                              className="hover:bg-gray-50 transition-colors duration-150"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                <div className="flex items-center">
                                  <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded mr-2">
                                    #{index + 1}
                                  </span>
                                  {product.productId || "ไม่ระบุรหัส"}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 mr-1.5 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                    />
                                  </svg>
                                  <span className="font-medium text-gray-700">
                                    {product.details?.split("|")[0] ||
                                      "ไม่มีรายละเอียด"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center">
                                  <span className="font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                    {product.initialPrice || "0"} บาท
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center">
                                  <span className="font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                    {product.soldPrice || "0"} บาท
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <span
                                  className={`px-3 py-1 rounded-full inline-flex items-center ${
                                    product.profit > 0
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {product.profit > 0 ? (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 mr-1"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 10l7-7m0 0l7 7m-7-7v18"
                                      />
                                    </svg>
                                  ) : (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 mr-1"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                      />
                                    </svg>
                                  )}
                                  {product.profit} บาท
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  {truncateAddress(product.soldTo, 6, 4)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1.5 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                  {formatDate(Number(product.soldAt) * 1000)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <Link
                                    href={`/verify/${product.productId}`}
                                    className="inline-flex items-center px-2.5 py-1.5 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 mr-1"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                      />
                                    </svg>
                                    ตรวจสอบ
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* สรุปยอดขาย - ปรับตามที่ต้องการ */}
                    <div className="bg-gray-50 p-4 border-t border-gray-200">
                      <div className="flex justify-end items-center">
                        <div className="flex items-center px-4 py-2 bg-white rounded-lg shadow-sm border border-purple-200">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2 text-purple-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <span className="text-gray-700 font-medium">
                            ยอดขายรวม:
                          </span>
                          <span className="ml-2 text-lg font-bold text-green-600">
                            {totalSales.toLocaleString()} บาท
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-10 text-center border border-dashed border-gray-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-16 w-16 mx-auto text-gray-400 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    <p className="text-gray-600 mb-2 font-medium">
                      ยังไม่มีประวัติการขายสินค้า
                    </p>
                    <p className="text-gray-500 text-sm">
                      เมื่อคุณขายสินค้าให้กับลูกค้า สินค้าจะปรากฏในรายการนี้
                    </p>
                    <button
                      onClick={() => setActiveTab("current")}
                      className="mt-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 17l-5-5m0 0l5-5m-5 5h12"
                        />
                      </svg>
                      กลับไปที่สินค้าปัจจุบัน
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      {selectedProductForTransfer && (
        <TransferProductModal
          isOpen={!!selectedProductForTransfer}
          onClose={() => setSelectedProductForTransfer(null)}
          onConfirm={handleTransferToCustomer}
          productId={selectedProductForTransfer.productId}
          productDetails={selectedProductForTransfer}
        />
      )}
    </>
  );
}
