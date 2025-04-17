// src/app/verify/[id]/page.js
"use client";
import { use } from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWeb3 } from "@/contexts/Web3Context";
import { useToast } from "@/contexts/ToastContext";
import { formatDate } from "@/utils/format";

export default function VerifyResultPage({ params }) {
  // ใช้ use() เพื่อ unwrap params ที่เป็น Promise
  const unwrappedParams = use(params);
  const productId = unwrappedParams.id;

  const [productData, setProductData] = useState(null);
  const [transferHistory, setTransferHistory] = useState([]);
  const [originalSeller, setOriginalSeller] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthentic, setIsAuthentic] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState("loading"); // loading, verified, unverified, error
  const { verifactContract, isConnected, connectWallet } = useWeb3();
  const { showError, showSuccess } = useToast();
  const router = useRouter();
  const [successorRequests, setSuccessorRequests] = useState([]);
  // ฟังก์ชันย่อที่อยู่กระเป๋าเงิน
  const truncateAddress = (address, startLength = 6, endLength = 4) => {
    if (!address) return "";

    if (address === "0x0000000000000000000000000000000000000000") {
      return "-";
    }
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
  };

  useEffect(() => {
    // ฟังก์ชันดึงข้อมูลสินค้า
    const fetchProductData = async () => {
      if (!productId) {
        setIsLoading(false);
        setVerificationStatus("error");
        return;
      }

      try {
        // หากไม่มีการเชื่อมต่อกับ contract ให้แสดงปุ่มเชื่อมต่อ
        if (!isConnected || !verifactContract) {
          setIsLoading(false);
          setVerificationStatus("error");
          showError("กรุณาเชื่อมต่อกระเป๋าเงินเพื่อตรวจสอบสินค้า");
          return;
        }

        // ตรวจสอบว่าสินค้ามีอยู่จริงหรือไม่
        const verifyResult = await verifactContract.methods
          .verifyProduct(productId)
          .call();

        if (!verifyResult.exists) {
          setIsAuthentic(false);
          setVerificationStatus("unverified");
          setIsLoading(false);
          return;
        }

        // ดึงข้อมูลสินค้า
        const product = await verifactContract.methods
          .getProduct(productId)
          .call();

        // แปลงข้อมูลที่ได้จาก Smart Contract ให้อยู่ในรูปแบบที่ใช้งานได้
        const formattedProduct = {
          productId: product[0]?.toString() || productId,
          details: product[1] || "ไม่มีรายละเอียด",
          initialPrice: product[2]?.toString() || "0",
          currentOwner: product[3] || "ไม่ระบุเจ้าของ",
          createdAt: product[4]?.toString() || "0",
          isActive: product[5] || false,
          designatedSuccessor: product[6] || null,
        };

        setProductData(formattedProduct);

        // ดึงประวัติการโอน
        const history = await verifactContract.methods
          .getTransferHistory(productId)
          .call();

        // แปลงข้อมูลประวัติการโอนให้อยู่ในรูปแบบที่ใช้งานได้
        const formattedHistory = history.map((item) => ({
          from: item[0] || "0x0000000000000000000000000000000000000000",
          to: item[1] || "ไม่ระบุ",
          price: item[2]?.toString() || "0",
          timestamp: item[3]?.toString() || "0",
        }));

        setTransferHistory(formattedHistory);

        // ดึงข้อมูลผู้ขายดั้งเดิม (original seller)
        if (formattedHistory.length > 0) {
          const originalSellerAddress = formattedHistory[0].to;

          try {
            const sellerInfo = await verifactContract.methods
              .getSellerInfo(originalSellerAddress)
              .call();

            setOriginalSeller(sellerInfo);
            if (isConnected && verifactContract && productData) {
              try {
                const requests = await verifactContract.methods
                  .getSuccessionRequests(productId)
                  .call();

                setSuccessorRequests(requests);
              } catch (requestError) {
                console.error(
                  "Error fetching succession requests:",
                  requestError
                );
              }
            }
          } catch (error) {
            console.log("Original seller might not be registered anymore");
          }
        }

        // ตรวจสอบว่าเป็นสินค้าใหม่ที่ยังไม่มีการขายต่อหรือไม่
        const isNewProduct =
          formattedHistory.length === 1 &&
          formattedHistory[0].from ===
            "0x0000000000000000000000000000000000000000";

        setIsAuthentic(formattedProduct.isActive);
        setVerificationStatus(
          formattedProduct.isActive ? "verified" : "unverified"
        );
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching product data:", error);
        showError("ไม่สามารถดึงข้อมูลสินค้าได้ โปรดลองอีกครั้ง");
        setVerificationStatus("error");
        setIsLoading(false);
      }
    };

    fetchProductData();
  }, [productId, verifactContract, isConnected, showError]);

  // ฟังก์ชันแสดงสถานะการยืนยัน
  const renderVerificationStatus = () => {
    switch (verificationStatus) {
      case "verified":
        return (
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-green-600"
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
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">ยืนยันแล้ว</h3>
              <p className="text-sm text-gray-600">
                สินค้านี้เป็นของแท้และได้รับการยืนยันแล้ว
              </p>
            </div>
          </div>
        );
      case "unverified":
        return (
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-red-600"
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
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">
                ไม่สามารถยืนยันได้
              </h3>
              <p className="text-sm text-gray-600">
                ไม่พบข้อมูลสินค้านี้ในระบบ หรือสินค้าอาจถูกระงับ
              </p>
            </div>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">
                เกิดข้อผิดพลาด
              </h3>
              <p className="text-sm text-gray-600">
                ไม่สามารถตรวจสอบสินค้าได้ โปรดลองอีกครั้งในภายหลัง
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">
                กำลังตรวจสอบ
              </h3>
              <p className="text-sm text-gray-600">กรุณารอสักครู่...</p>
            </div>
          </div>
        );
    }
  };

  // ฟังก์ชันเพื่อตรวจสอบว่าเป็นสินค้าใหม่ที่ยังไม่มีการขายต่อหรือไม่
  const isNewUnownedProduct = () => {
    if (!transferHistory || transferHistory.length === 0) return false;

    // เป็นสินค้าใหม่เมื่อมีประวัติเพียง 1 รายการ และเป็นการสร้างใหม่จากผู้ผลิต (address 0x0)
    return (
      transferHistory.length === 1 &&
      transferHistory[0].from === "0x0000000000000000000000000000000000000000"
    );
  };

  // ตรวจสอบผู้ถือครองปัจจุบัน
  const renderCurrentOwner = () => {
    if (!productData) return "ไม่พบข้อมูล";

    // กรณีเป็นสินค้าใหม่ที่ยังไม่มีการขายต่อ
    if (isNewUnownedProduct()) {
      return "ยังไม่มีเจ้าของ (สินค้าใหม่จากผู้ผลิต)";
    }

    // กรณีมี address เป็น 0x0
    if (
      productData.currentOwner === "0x0000000000000000000000000000000000000000"
    ) {
      return "ไม่มีเจ้าของ";
    }

    // กรณีปกติ
    return truncateAddress(productData.currentOwner, 8, 6);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ส่วนหัว */}
      <header className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
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
                <h1 className="text-xl font-bold text-gray-900">VeriFact</h1>
              </Link>
            </div>

            {!isConnected && (
              <button
                onClick={connectWallet}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1.5"
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
            )}
          </div>
        </div>
      </header>

      {/* เนื้อหาหลัก */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ลิงก์กลับไปหน้าตรวจสอบ */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            กลับไปหน้าก่อนหน้า
          </button>
        </div>

        {/* ส่วนแสดงผลการตรวจสอบ */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          {/* ส่วนหัวของการ์ด */}
          <div
            className={`px-6 py-8 ${
              isAuthentic === true
                ? "bg-green-600"
                : isAuthentic === false
                ? "bg-red-600"
                : "bg-blue-600"
            }`}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  ผลการตรวจสอบสินค้า
                </h2>
                <p className="text-sm text-white opacity-90">
                  รหัสสินค้า: {productId}
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                {!isLoading && isAuthentic !== null && (
                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                      isAuthentic
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {isAuthentic ? (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-1.5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        สินค้าของแท้
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-1.5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        ไม่สามารถยืนยันได้
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ส่วนเนื้อหาของการ์ด */}
          <div className="px-6 py-8">
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {/* สถานะการยืนยัน */}
                <div className="mb-8">{renderVerificationStatus()}</div>

                {/* ข้อมูลสินค้า */}
                {productData && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      ข้อมูลสินค้า
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            รหัสสินค้า
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {productData.productId}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            เจ้าของปัจจุบัน
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {renderCurrentOwner()}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            วันที่ลงทะเบียน
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {formatDate(Number(productData.createdAt) * 1000)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            ราคาเริ่มต้น
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {productData.initialPrice} บาท
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            ลงทะเบียนโดย
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {originalSeller
                              ? `${originalSeller.storeName} (${truncateAddress(
                                  originalSeller.sellerAddress
                                )})`
                              : transferHistory.length > 0
                              ? truncateAddress(transferHistory[0].to, 8, 6)
                              : "ไม่ทราบผู้ลงทะเบียน"}
                          </dd>
                        </div>
                        <div className="md:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">
                            รายละเอียด
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {productData.details}
                          </dd>
                        </div>
                        {productData.designatedSuccessor && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              ผู้รับสืบทอด
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {truncateAddress(productData.designatedSuccessor)}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>
                )}
                {successorRequests && successorRequests.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      ประวัติการร้องขอรับสืบทอด
                    </h3>
                    <div className="bg-white rounded-lg p-4">
                      {successorRequests.map((successor, index) => (
                        <div
                          key={index}
                          className="mb-2 flex items-center justify-between"
                        >
                          <span className="text-sm text-gray-700">
                            {successor.substring(0, 6)}...
                            {successor.substring(successor.length - 4)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ประวัติการโอน */}
                {transferHistory && transferHistory.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      ประวัติการถือครอง
                    </h3>
                    <div className="overflow-hidden">
                      <div className="relative overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                วันที่
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                จาก
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                ไปยัง
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                ราคา
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {transferHistory.map((transfer, index) => (
                              <tr key={`transfer-${index}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {formatDate(
                                    Number(transfer.timestamp) * 1000
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {transfer.from ===
                                  "0x0000000000000000000000000000000000000000"
                                    ? "ผู้ผลิต (สร้างใหม่)"
                                    : truncateAddress(transfer.from, 4, 4)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {truncateAddress(transfer.to, 4, 4)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {Number(transfer.price) > 0
                                    ? `${transfer.price} บาท`
                                    : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* กรณีที่ไม่พบสินค้า */}
                {verificationStatus === "unverified" && !productData && (
                  <div className="text-center py-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-16 w-16 text-red-500 mx-auto mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      ไม่พบสินค้า
                    </h3>
                    <p className="text-gray-600 mb-6">
                      ไม่พบข้อมูลสินค้ารหัส {productId} ในระบบ
                      <br />
                      โปรดตรวจสอบรหัสอีกครั้งหรือติดต่อผู้ขายเพื่อขอข้อมูลเพิ่มเติม
                    </p>
                    <Link
                      href="/verify"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      ตรวจสอบสินค้าอื่น
                    </Link>
                  </div>
                )}

                {/* กรณีที่เกิดข้อผิดพลาด */}
                {verificationStatus === "error" && (
                  <div className="text-center py-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-16 w-16 text-yellow-500 mx-auto mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      เกิดข้อผิดพลาด
                    </h3>
                    <p className="text-gray-600 mb-6">
                      ไม่สามารถตรวจสอบสินค้าได้ในขณะนี้
                      <br />
                      โปรดลองอีกครั้งในภายหลัง
                    </p>
                    <Link
                      href="/verify"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      ย้อนกลับ
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* กล่องข้อมูลเพิ่มเติม */}
        {verificationStatus === "verified" && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                การรับประกันความถูกต้อง
              </h3>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-blue-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h2a1 1 0 100-2H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      สินค้านี้ได้รับการยืนยันความถูกต้องด้วยเทคโนโลยีบล็อกเชน
                      ข้อมูลทั้งหมดที่แสดงบนหน้านี้มีการบันทึกอยู่บนเครือข่ายที่ไม่สามารถแก้ไขได้
                      ทำให้มั่นใจได้ว่าประวัติการถือครองและข้อมูลสินค้าเป็นข้อมูลจริงที่ไม่ถูกปลอมแปลง
                    </p>
                    <p className="mt-2 text-sm text-blue-800">
                      คุณสามารถตรวจสอบความถูกต้องของสินค้านี้ซ้ำได้ทุกเมื่อโดยการสแกน
                      QR Code บนสินค้าหรือกรอกรหัสสินค้าอีกครั้ง
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
