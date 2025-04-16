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

export default function SellerDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState([]);
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
    const checkAdmin = async () => {
      if (!verifactContract || !account) return;

      try {
        const adminAddress = await verifactContract.methods.admin().call();
        const isUserAdmin =
          account.toLowerCase() === adminAddress.toLowerCase();
        setIsAdmin(isUserAdmin);

        if (!isUserAdmin) {
          showError("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
          router.push("/");
        } else {
          fetchProducts();
        }
      } catch (error) {
        console.error("Error checking admin:", error);
        showError("เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์");
      }
    };

    if (isConnected) {
      checkAdmin();
    }
  }, [verifactContract, account, isConnected]);

  // ดึงข้อมูลสินค้าของผู้ขาย
  const fetchProducts = async () => {
    if (!verifactContract || !account) return;

    try {
      setIsLoading(true);

      const productIds = await verifactContract.methods
        .getProductsByOwner(account)
        .call();

      console.log("productIds:", productIds);

      const productsData = await Promise.all(
        productIds.map(async (id) => {
          const product = await verifactContract.methods.getProduct(id).call();
          console.log("product data for ID", id, ":", product);

          // แปลงข้อมูลจาก array-like object เป็น object ที่มี property ชัดเจน
          return {
            productId: product[0]?.toString() || id?.toString(),
            details: product[1] || "ไม่มีรายละเอียด",
            initialPrice: product[2]?.toString() || "0",
            currentOwner: product[3] || "ไม่ระบุเจ้าของ",
            createdAt: product[4]?.toString() || "0",
            isActive: product[5] || false,
            // เพิ่ม property ตามที่จำเป็น
          };
        })
      );

      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
      showError("ไม่สามารถดึงข้อมูลสินค้าได้");
    } finally {
      setIsLoading(false);
    }
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

    const details = `${formData.productName} | ${formData.productModel} | ${formData.serialNumber}`;

    try {
      // แก้ไขส่วนนี้
      const result = await verifactContract.methods
        .registerProduct(details, formData.initialPrice)
        .send({ from: account });

      console.log("Transaction result:", result);

      let productId;

      if (result.events && result.events.ProductRegistered) {
        productId = result.events.ProductRegistered.returnValues.productId;
      } else if (result.logs && result.logs.length > 0) {
        const registrationLog = result.logs.find(
          (log) =>
            log.event === "ProductRegistered" ||
            log.topics?.[0]?.includes("ProductRegistered")
        );

        if (registrationLog && registrationLog.returnValues) {
          productId = registrationLog.returnValues.productId;
        }
      }

      if (productId) {
        showSuccess(`ลงทะเบียนสินค้าสำเร็จ! รหัสสินค้า: ${productId}`);
      } else {
        showSuccess("ลงทะเบียนสินค้าสำเร็จ!");
      }

      setFormData({
        productName: "",
        productModel: "",
        serialNumber: "",
        initialPrice: "",
      });

      fetchProducts();
    } catch (error) {
      console.error("Error registering product:", error);
      showError("เกิดข้อผิดพลาดในการลงทะเบียนสินค้า");
    } finally {
      setIsLoading(false);
    }
  };
  // การโอนสินค้าให้ลูกค้า
  // ในไฟล์ Dashboard
  const handleTransferToCustomer = async (productId, buyerAddress, price) => {
    try {
      setIsLoading(true);

      await verifactContract.methods
        .transferProduct(productId, buyerAddress, price)
        .send({ from: account });

      showSuccess(`โอนสินค้ารหัส ${productId} ให้กับ ${buyerAddress} สำเร็จ!`);

      fetchProducts();
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

  // ฟังก์ชันสำหรับสร้างตัวอักษรย่อ (Initials) จากชื่อผู้ใช้
  const getInitials = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    } else if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
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
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">
            ไม่มีสิทธิ์เข้าถึง
          </h2>
          <p className="text-gray-600 mb-6">
            คุณไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะผู้ขาย (แอดมิน)
            เท่านั้นที่สามารถเข้าถึงได้
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
          {/* ส่วนหัวหน้าผู้ขาย */}
          {/* <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">หน้าจัดการผู้ขาย</h1>
          <p className="text-gray-500 mt-1">ลงทะเบียนและจัดการสินค้าของคุณ</p>
        </div> */}

          {/* ส่วนภาพรวม */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-2">สินค้าทั้งหมด</h2>
              <p className="text-3xl font-bold text-blue-600">
                {products.length}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-2">สินค้าที่พร้อมขาย</h2>
              <p className="text-3xl font-bold text-green-600">
                {products.filter((p) => p.isActive).length}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-2">สินค้าที่ขายแล้ว</h2>
              <p className="text-3xl font-bold text-purple-600">
                {products.filter((p) => !p.isActive).length}
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

                  <input
                    type="text"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleInputChange}
                    placeholder="หมายเลขซีเรียล"
                    className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:outline-none"
                    required
                  />
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

          {/* ส่วนแสดงรายการสินค้า */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">รายการสินค้าทั้งหมด</h2>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
              </div>
            ) : products.length > 0 ? (
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
                        รายละเอียด
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        ราคา
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        สถานะ
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        เจ้าของ
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
                    {products.map((product, index) => (
                      <tr key={`product-${product.productId || index}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.productId || "ไม่ระบุรหัส"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.details || "ไม่มีรายละเอียด"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.initialPrice || "0"} บาท
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.isActive !== undefined ? (
                            product.isActive ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                พร้อมขาย
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                ไม่แอคทีฟ
                              </span>
                            )
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              ไม่ทราบสถานะ
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.currentOwner
                            ? product.currentOwner.toLowerCase() ===
                              account?.toLowerCase()
                              ? "คุณ (ผู้ขาย)"
                              : `${product.currentOwner.substring(
                                  0,
                                  6
                                )}...${product.currentOwner.substring(
                                  product.currentOwner.length - 4
                                )}`
                            : "ไม่ระบุเจ้าของ"}
                        </td>
                        {/* ส่วนการจัดการ */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link
                              href={`/verify/${product.productId}`}
                              className="text-blue-600 hover:text-blue-900 px-2 py-1"
                            >
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
                                  className="text-green-600 hover:text-green-900 px-2 py-1"
                                >
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
                                    fetchProducts();
                                  } catch (error) {
                                    console.error(
                                      "Error disabling product:",
                                      error
                                    );
                                    showError("เกิดข้อผิดพลาดในการระงับสินค้า");
                                  }
                                }}
                                className="text-red-600 hover:text-red-900 px-2 py-1"
                              >
                                ระงับ
                              </button>
                            )}

                            {!product.isActive && (
                              <button
                                onClick={async () => {
                                  try {
                                    await verifactContract.methods
                                      .setProductStatus(product.productId, true)
                                      .send({ from: account });
                                    showSuccess(
                                      `เปิดใช้งานสินค้ารหัส ${product.productId} สำเร็จ`
                                    );
                                    fetchProducts();
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
                                className="text-blue-600 hover:text-blue-900 px-2 py-1"
                              >
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
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">
                  ยังไม่มีสินค้าในระบบ กรุณาลงทะเบียนสินค้าใหม่
                </p>
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
