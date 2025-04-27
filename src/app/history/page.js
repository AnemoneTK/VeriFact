// src/app/history/page.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWeb3 } from "@/contexts/Web3Context";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/utils/format";
import { useRouter } from "next/navigation";

export default function TransferHistoryPage() {
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { verifactContract, account, isConnected, connectWallet } = useWeb3();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // ถ้าไม่มีผู้ใช้ ให้นำทางไปยังหน้าเข้าสู่ระบบ
    if (!user && !isLoading) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);
  useEffect(() => {
    // ถ้าไม่มีผู้ใช้ ให้นำทางไปยังหน้าเข้าสู่ระบบ
    if (historyData) {
      console.log("historyData", historyData);
    }
  }, [historyData]);

  useEffect(() => {
    const fetchTransferHistory = async () => {
      if (!isConnected || !account || !verifactContract) {
        setIsLoading(false);
        return;
      }

      try {
        // 1. ดึงรายการ ID สินค้าทั้งหมดในระบบ (ไม่ใช่แค่ที่เป็นเจ้าของปัจจุบัน)
        const allProductIds = await verifactContract.methods
          .getAllProductIds()
          .call();
        let allTransferHistory = [];

        // 2. วนลูปตรวจสอบแต่ละสินค้าว่ามีประวัติที่เกี่ยวข้องกับบัญชีนี้หรือไม่
        for (const productId of allProductIds) {
          try {
            const product = await verifactContract.methods
              .getProduct(productId)
              .call();
            const transferHistory = await verifactContract.methods
              .getTransferHistory(productId)
              .call();

            // 3. กรองประวัติที่เกี่ยวข้องกับบัญชีปัจจุบัน (ทั้งส่งและรับ)
            const relevantHistory = transferHistory.filter(
              (transfer) =>
                transfer[0].toLowerCase() === account.toLowerCase() || // ผู้ส่ง (from)
                transfer[1].toLowerCase() === account.toLowerCase() // ผู้รับ (to)
            );

            if (relevantHistory.length > 0) {
              // 4. แปลงข้อมูลให้อยู่ในรูปแบบที่ใช้งานง่าย
              const formattedHistory = relevantHistory.map((transfer) => ({
                from: transfer[0],
                to: transfer[1],
                price:
                  typeof transfer[2] === "bigint"
                    ? transfer[2].toString()
                    : transfer[2],
                timestamp:
                  typeof transfer[3] === "bigint"
                    ? transfer[3].toString()
                    : transfer[3],
                productId,
                productName: product.details?.split("|")[0] || "ไม่ระบุชื่อ",
                productDetails: product.details,
                transferType:
                  transfer[0].toLowerCase() === account.toLowerCase()
                    ? "sent"
                    : "received",
              }));

              allTransferHistory = [...allTransferHistory, ...formattedHistory];
            }
          } catch (err) {
            console.error(`Error processing product ${productId}:`, err);
          }
        }

        // 5. เรียงลำดับตามเวลาล่าสุด
        allTransferHistory.sort((a, b) => {
          const timeA = BigInt(String(a.timestamp).replace("n", ""));
          const timeB = BigInt(String(b.timestamp).replace("n", ""));
          return timeB > timeA ? 1 : -1;
        });

        console.log("Found transfer history:", allTransferHistory);
        setHistoryData(allTransferHistory);
      } catch (err) {
        console.error("Error fetching transfer history:", err);
        setError("ไม่สามารถดึงประวัติการโอนได้ โปรดลองอีกครั้ง");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransferHistory();
  }, [account, verifactContract, isConnected]);

  // ฟังก์ชันสำหรับย่อที่อยู่กระเป๋าเงิน
  const truncateAddress = (address, startLength = 6, endLength = 4) => {
    if (!address) return "";
    if (address === "0x0000000000000000000000000000000000000000") {
      return "สร้างใหม่";
    }
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
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
                คุณต้องเข้าสู่ระบบเพื่อดูประวัติการโอนสินค้า
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
                กรุณาเชื่อมต่อกระเป๋าเงินของคุณเพื่อดูประวัติการโอนสินค้า
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

            <Link
              href="/dashboard"
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
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              แดชบอร์ด
            </Link>
          </div>
        </div>
      </header>

      {/* เนื้อหาหลัก */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            ประวัติการโอนสินค้า
          </h1>

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

          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
          ) : historyData.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-10 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-gray-400 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ไม่พบประวัติการโอน
              </h3>
              <p className="text-gray-600 mb-4">
                คุณยังไม่มีประวัติการโอนสินค้าใดๆ
              </p>
              <div className="mt-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  กลับไปที่แดชบอร์ด
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="relative overflow-x-auto rounded-md border border-gray-200">
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
                        รหัสสินค้า
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
                        ประเภท
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        คู่กรณี
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
                        การจัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {historyData.map((item, index) => (
                      <tr
                        key={`transfer-${index}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.timestamp
                            ? formatDate(item.timestamp)
                            : "ไม่ระบุวันที่"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                          {item.productId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.productDetails?.split("|")[0] || "ไม่ระบุ"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {item.transferType === "sent" ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              ส่งออก
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              รับเข้า
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.transferType === "sent"
                            ? truncateAddress(item.to)
                            : truncateAddress(item.from)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.price ? `${item.price} บาท` : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/verify/${item.productId}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            ตรวจสอบ
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ส่วนเพิ่มเติม - คำแนะนำ */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">การจัดการสินค้า</h2>
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
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
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                สินค้าของฉัน
              </h3>
              <p className="text-gray-600 mb-3">
                ดูรายการสินค้าที่คุณเป็นเจ้าของทั้งหมด
              </p>
              <Link
                href="/dashboard"
                className="text-purple-600 hover:text-purple-800 font-medium text-sm"
              >
                ดูสินค้า →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
