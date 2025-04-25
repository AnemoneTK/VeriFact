// src/app/dashboard/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useWeb3 } from "@/contexts/Web3Context";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { formatDate } from "@/utils/format";
import Image from "next/image";

export default function DashboardPage() {
  const [userProducts, setUserProducts] = useState([]);
  const [praseProduct, setPraseProduct] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const [showFullWallet, setShowFullWallet] = useState(false);
  const {
    verifactContract,
    account,
    isConnected,
    isAdmin,
    isSeller,
    connectWallet,
    disconnectWallet,
  } = useWeb3();
  const { user } = useAuth() || {};
  const { showSuccess, showInfo } = useToast();
  const router = useRouter();
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (userProducts) {
      console.log("userProducts", userProducts);
      const parsed = userProducts.map((item) => ({
        productId: item[0],
        description: item[1],
        amount: item[2],
        address: item[3],
        timestamp: item[4],
        status: item[5],
        toAddress: item[6],
      }));
      setPraseProduct(parsed);
      console.log("praseProduct", praseProduct);
    }
  }, [userProducts]);
  useEffect(() => {
    async function fetchUserProducts() {
      if (!isConnected || !account || !verifactContract) {
        setIsLoading(false);
        return;
      }

      // ถ้าเป็น admin ให้ไปยังหน้า Admin Dashboard แทน
      if (isAdmin || isSeller) {
        router.push("/seller/dashboard");
        return;
      }

      try {
        // ดึงรายการสินค้าของผู้ใช้
        const productIds = await verifactContract.methods
          .getProductsByOwner(account)
          .call();

        // ดึงข้อมูลสินค้าแต่ละชิ้น
        const products = await Promise.all(
          productIds.map(async (productId) => {
            const product = await verifactContract.methods
              .getProduct(productId)
              .call();

            // เพิ่มข้อมูลผู้รับสืบทอด
            const successorRequests = await verifactContract.methods
              .getSuccessionRequests(productId)
              .call();

            return {
              ...product,
              successorRequests,
              hasSuccessorRequest: successorRequests.length > 0,
            };
          })
        );

        setUserProducts(products);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching user products:", err);
        setError("ไม่สามารถดึงข้อมูลสินค้าได้ โปรดลองอีกครั้ง");
        setIsLoading(false);
      }
    }

    fetchUserProducts();
  }, [account, verifactContract, isConnected, isAdmin, isSeller, router]);

  // ฟังก์ชันสำหรับย่อที่อยู่กระเป๋าเงิน
  const truncateAddress = (address, startLength = 6, endLength = 4) => {
    if (!address) return "";
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
  };

  // ฟังก์ชันคัดลอกที่อยู่กระเป๋าเงิน
  const copyWalletAddress = (e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(account);
    showSuccess("คัดลอกที่อยู่กระเป๋าเงินแล้ว");
  };

  // ฟังก์ชันคำนวณสีพื้นหลังจากชื่อผู้ใช้หรืออีเมล (เพื่อใช้ในกรณีไม่มีรูปโปรไฟล์)
  const getInitialColors = () => {
    // ใช้ชื่อหรืออีเมลของผู้ใช้ในการสร้างสี
    const name = user?.name || user?.email || "User";
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // สร้างสีพื้นหลัง
    const hue = Math.abs(hash % 360);
    const bgColor = `hsl(${hue}, 70%, 80%)`;
    const textColor = `hsl(${hue}, 70%, 20%)`;

    return { bgColor, textColor };
  };

  // ฟังก์ชันสำหรับสร้างตัวอักษรย่อ (Initials) จากชื่อผู้ใช้
  const getInitials = () => {
    if (user?.name) {
      // ถ้ามีชื่อ ใช้ตัวอักษรแรกของชื่อ
      return user.name.charAt(0).toUpperCase();
    } else if (user?.email) {
      // ถ้ามีอีเมล ใช้ตัวอักษรแรกของอีเมล
      return user.email.charAt(0).toUpperCase();
    }
    // ค่าเริ่มต้น
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

  useEffect(() => {
    // ถ้าไม่มีผู้ใช้และการโหลดเสร็จสิ้นแล้ว ให้นำทางไปยังหน้าเข้าสู่ระบบ
    if (!user && !isLoading) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    async function fetchUserProducts() {
      if (!isConnected || !account || !verifactContract) {
        setIsLoading(false);
        return;
      }

      try {
        // ดึงรายการสินค้าของผู้ใช้
        const productIds = await verifactContract.methods
          .getProductsByOwner(account)
          .call();

        // ดึงข้อมูลสินค้าแต่ละชิ้น
        const products = await Promise.all(
          productIds.map(async (productId) => {
            const product = await verifactContract.methods
              .getProduct(productId)
              .call();
            return product;
          })
        );

        setUserProducts(products);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching user products:", err);
        setError("ไม่สามารถดึงข้อมูลสินค้าได้ โปรดลองอีกครั้ง");
        setIsLoading(false);
      }
    }

    fetchUserProducts();
  }, [account, verifactContract, isConnected]);

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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-red-500 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                กรุณาเข้าสู่ระบบ
              </h2>
              <p className="mt-2 text-gray-600">
                คุณต้องเข้าสู่ระบบเพื่อดูแดชบอร์ดของคุณ
              </p>
              <div className="mt-6">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  เข้าสู่ระบบ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-yellow-500 mx-auto"
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
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                เชื่อมต่อกระเป๋าเงิน
              </h2>
              <p className="mt-2 text-gray-600">
                กรุณาเชื่อมต่อกระเป๋าเงินของคุณเพื่อดูสินค้าที่คุณเป็นเจ้าของ
              </p>
              <div className="mt-6">
                <button
                  onClick={connectWallet}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  เชื่อมต่อกระเป๋าเงิน
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ส่วนหัวปรับปรุงใหม่ */}
      <header className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* โลโก้และชื่อแอป */}
            <div className="flex items-center space-x-3">
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
              <h1 className="text-xl font-bold text-gray-900">VeriFact</h1>
            </div>

            {/* เมนูด้านขวา */}
            <div className="flex items-center space-x-4">
              {/* ข้อมูล Wallet */}
              <div
                className="bg-gray-100 rounded-full py-1.5 px-3 flex items-center space-x-2 cursor-pointer hover:bg-gray-200"
                onClick={() => setShowFullWallet(!showFullWallet)}
              >
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <div className="font-mono text-sm">
                  {showFullWallet ? account : truncateAddress(account)}
                </div>
                <button
                  onClick={copyWalletAddress}
                  className="text-blue-500 hover:text-blue-700"
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

              {/* ปุ่มเมนูหลัก */}
              <Link
                href="/transfer"
                className="relative inline-flex items-center justify-center p-2 text-gray-500 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="โอนสินค้า"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
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
              </Link>

              <Link
                href="/verify"
                className="relative inline-flex items-center justify-center p-2 text-gray-500 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="ตรวจสอบสินค้า"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </Link>

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
                        href="/profile"
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
                        href="/settings"
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

                      <hr className="my-1" />

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

      {/* เนื้อหาหลัก */}
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* หัวข้อหลักของหน้า */}
          {/* <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
            <p className="mt-1 text-gray-500">
              ยินดีต้อนรับกลับมา, {user.name || user.email}
            </p>
          </div> */}

          {/* ส่วนแสดงสินค้าของฉัน */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                สินค้าของฉัน
              </h2>
              <Link
                href="/transfer"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8z" />
                  <path d="M12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                </svg>
                โอนสินค้า
              </Link>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {praseProduct.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-gray-400 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  คุณยังไม่มีสินค้า
                </h3>
                <p className="text-gray-600 mb-4">
                  คุณยังไม่มีสินค้าในความเป็นเจ้าของ
                  โปรดตรวจสอบกระเป๋าเงินที่เชื่อมต่อ
                </p>
                <Link
                  href="/verify"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  ตรวจสอบสินค้า
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {praseProduct.map((product) => (
                  <div
                    key={product.productId}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {product.description?.split("|")[0] || "สินค้า"}
                          </h3>
                          <p className="text-sm text-gray-500 mb-3">
                            รหัส: {product.productId}
                          </p>
                        </div>
                        {product.status ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            แอคทีฟ
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ไม่แอคทีฟ
                          </span>
                        )}
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">
                            วันที่ได้รับ:
                          </span>
                          <span className="text-sm text-gray-700">
                            {formatDate(Number(product.timestamp) * 1000)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">ราคา:</span>
                          <span className="text-sm text-gray-700">
                            {product.amount} บาท
                          </span>
                        </div>
                      </div>
                      {product.designatedSuccessor && (
                        <div className="text-sm text-gray-600">
                          ผู้รับสืบทอด:{" "}
                          {truncateAddress(product.designatedSuccessor)}
                          {product.hasSuccessorRequest && (
                            <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                              มีคำขอ
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-6 flex space-x-2">
                        <Link
                          href={`/verify/${product.productId}`}
                          className="flex-1 bg-white hover:bg-gray-50 text-blue-600 text-center py-2 px-4 border border-blue-200 rounded-md text-sm font-medium"
                        >
                          ตรวจสอบ
                        </Link>
                        <Link
                          href={`/transfer?productId=${product.productId}`}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 border border-transparent rounded-md text-sm font-medium"
                        >
                          โอน
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ส่วนเพิ่มเติม */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">คำแนะนำ</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-5">
                <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ตรวจสอบสินค้า
                </h3>
                <p className="text-gray-600 mb-3">
                  ตรวจสอบความถูกต้องของสินค้าด้วยรหัสสินค้า
                </p>
                <Link
                  href="/verify"
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  ตรวจสอบเลย →
                </Link>
              </div>

              <div className="bg-green-50 rounded-lg p-5">
                <div className="rounded-full bg-green-100 w-12 h-12 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600"
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
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  โอนสินค้า
                </h3>
                <p className="text-gray-600 mb-3">
                  โอนกรรมสิทธิ์สินค้าให้กับผู้อื่นอย่างปลอดภัย
                </p>
                <Link
                  href="/transfer"
                  className="text-green-600 hover:text-green-800 font-medium text-sm"
                >
                  โอนเลย →
                </Link>
              </div>

              <div className="bg-purple-50 rounded-lg p-5">
                <div className="rounded-full bg-purple-100 w-12 h-12 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ประวัติการโอน
                </h3>
                <p className="text-gray-600 mb-3">
                  ดูประวัติการโอนสินค้าทั้งหมดของคุณ
                </p>
                <Link
                  href="/history"
                  className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                >
                  ดูประวัติ →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
