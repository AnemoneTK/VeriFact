// src/app/verify/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWeb3 } from "@/contexts/Web3Context";
import { useToast } from "@/contexts/ToastContext";
import Link from "next/link";

export default function VerifyPage() {
  const [productId, setProductId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const router = useRouter();
  const { verifactContract, isConnected, connectWallet } = useWeb3();
  const { showError, showInfo } = useToast();

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!productId.trim()) {
      showError("กรุณากรอกรหัสสินค้าหรือหมายเลขซีเรียล");
      return;
    }

    setIsSearching(true);

    try {
      // ค้นหาด้วย verifactContract หากเชื่อมต่อแล้ว
      if (isConnected && verifactContract) {
        try {
          // ตรวจสอบด้วย productId ก่อน
          const result = await verifactContract.methods
            .verifyProduct(productId)
            .call();

          if (result.exists) {
            // ถ้าพบสินค้า ให้นำทางไปยังหน้าผลลัพธ์
            router.push(`/verify/${productId}`);
            return;
          }

          // ถ้าไม่พบสินค้าด้วย productId ให้ลองค้นหาด้วยหมายเลขซีเรียล
          // ดึงทุกสินค้าและค้นหาจากรายละเอียด
          const allProducts = await getAllProducts();

          // ค้นหาสินค้าที่มีหมายเลขซีเรียลตรงกับที่ระบุ
          const matchedProduct = allProducts.find((product) => {
            const parts = product.details.split("|");
            if (parts.length >= 3) {
              const serialNumber = parts[2].trim();
              return serialNumber === productId.trim();
            }
            return false;
          });

          if (matchedProduct) {
            // หากพบสินค้าที่มีหมายเลขซีเรียลตรงกัน ให้นำทางไปยังหน้าผลลัพธ์ด้วย productId
            router.push(`/verify/${matchedProduct.productId}`);
            return;
          }

          // ถ้าไม่พบทั้งสองกรณี
          showError("ไม่พบสินค้านี้ในระบบ");
          setIsSearching(false);
        } catch (err) {
          console.error("Error searching products:", err);
          showError("เกิดข้อผิดพลาดในการค้นหาสินค้า");
          setIsSearching(false);
        }
      } else {
        // ถ้าไม่ได้เชื่อมต่อกระเป๋าเงิน ให้นำทางไปยังหน้าผลลัพธ์โดยตรง
        // (ในกรณีนี้จะต้องมีการค้นหาด้วยหมายเลขซีเรียลในหน้าผลลัพธ์อีกครั้ง)
        router.push(`/verify/${productId}`);
      }
    } catch (err) {
      console.error("Error verifying product:", err);
      showError("เกิดข้อผิดพลาดในการตรวจสอบสินค้า โปรดลองอีกครั้ง");
      setIsSearching(false);
    }
  };

  const getAllProducts = async () => {
    // ต้องเพิ่มฟังก์ชันนี้เพื่อดึงสินค้าทั้งหมดจาก Smart Contract
    // เช่น อาจใช้การลูปค้นหาสินค้าตั้งแต่ ID 1 ไปเรื่อยๆ จนไม่พบสินค้า

    // ตัวอย่าง (ต้องปรับให้เข้ากับ Smart Contract จริง)
    let products = [];
    let id = 1;
    let notFound = 0;

    // ค้นหาจนกว่าจะเจอสินค้าไม่พบติดต่อกัน 5 ครั้ง
    while (notFound < 5) {
      try {
        const product = await verifactContract.methods.getProduct(id).call();
        if (product && product.details) {
          products.push(product);
          notFound = 0; // รีเซ็ตตัวนับเมื่อพบสินค้า
        } else {
          notFound++;
        }
      } catch (error) {
        notFound++;
      }
      id++;
    }

    return products;
  };

  // แสดงโหมดสแกน QR Code (จำลอง)
  const handleScanToggle = () => {
    if (scanMode) {
      setScanMode(false);
    } else {
      setScanMode(true);
      showInfo("การสแกน QR Code อยู่ระหว่างการพัฒนา");
    }
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
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* ส่วนหัวของคาร์ด */}
          <div className="bg-blue-600 px-6 py-8 sm:p-10 sm:pb-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-xl leading-9 font-semibold text-white sm:text-3xl sm:leading-10">
                ตรวจสอบความถูกต้องของสินค้า
              </h2>
              <p className="mt-3 text-lg leading-7 text-blue-200">
                ตรวจสอบว่าสินค้าของคุณเป็นของแท้หรือไม่
                และติดตามประวัติการถือครอง
              </p>
            </div>
          </div>

          {/* ส่วนเนื้อหาของคาร์ด */}
          <div className="px-6 py-8 sm:px-10">
            <div className="max-w-md mx-auto">
              {/* แท็บเลือกวิธีการตรวจสอบ */}
              <div className="flex rounded-md shadow-sm mb-6">
                <button
                  onClick={() => setScanMode(false)}
                  className={`w-1/2 py-2 px-4 text-sm font-medium rounded-l-md focus:outline-none ${
                    !scanMode
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-500 hover:text-gray-700 border border-gray-300"
                  }`}
                >
                  กรอกรหัสสินค้า
                </button>
                <button
                  onClick={handleScanToggle}
                  className={`w-1/2 py-2 px-4 text-sm font-medium rounded-r-md focus:outline-none ${
                    scanMode
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-500 hover:text-gray-700 border border-gray-300"
                  }`}
                >
                  สแกน QR Code
                </button>
              </div>

              {/* แสดงโหมดสแกน QR Code หรือกรอกรหัส */}
              {scanMode ? (
                <div className="text-center py-10 px-4">
                  <div className="mb-6 w-48 h-48 mx-auto border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-20 w-20 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-700 mb-4">
                    จัดตำแหน่ง QR Code ให้อยู่ในกรอบ
                  </p>
                  <p className="text-sm text-gray-500">
                    คุณสมบัตินี้อยู่ระหว่างการพัฒนา
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSearch}>
                  <div className="mb-6">
                    <label
                      htmlFor="productId"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      รหัสสินค้า
                    </label>
                    <input
                      id="productId"
                      type="text"
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="กรอกรหัสสินค้าที่ต้องการตรวจสอบ"
                      required
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      รหัสสินค้าอยู่บนกล่องหรือสติกเกอร์สินค้า
                    </p>
                  </div>
                  <div>
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isSearching ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          กำลังตรวจสอบ...
                        </>
                      ) : (
                        "ตรวจสอบ"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* ส่วนคำอธิบายการใช้งาน */}
        <div className="mt-10">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            วิธีการตรวจสอบสินค้า
          </h3>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <span className="text-xl font-semibold text-blue-600">1</span>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  หารหัสสินค้า
                </h4>
                <p className="text-gray-600">
                  รหัสสินค้าจะอยู่บนกล่อง, สติกเกอร์
                  หรือเอกสารที่มาพร้อมกับสินค้า
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <span className="text-xl font-semibold text-blue-600">2</span>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  กรอกหรือสแกน
                </h4>
                <p className="text-gray-600">
                  กรอกรหัสในช่องข้างบน หรือสแกน QR Code ที่อยู่บนสินค้า
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <span className="text-xl font-semibold text-blue-600">3</span>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  ตรวจสอบผล
                </h4>
                <p className="text-gray-600">
                  ดูผลการตรวจสอบสินค้าและประวัติการถือครองแบบเรียลไทม์
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ส่วนคำถามที่พบบ่อย */}
        <div className="mt-10">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            คำถามที่พบบ่อย
          </h3>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="space-y-6">
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-2">
                  ฉันจะรู้ได้อย่างไรว่าสินค้าเป็นของแท้?
                </h4>
                <p className="text-gray-600">
                  ระบบ VeriFact
                  ใช้เทคโนโลยีบล็อกเชนในการเก็บข้อมูลการผลิตและการถือครองสินค้า
                  ทำให้มั่นใจได้ว่าข้อมูลไม่สามารถแก้ไขได้
                  ถ้าสินค้าถูกยืนยันในระบบ
                  แสดงว่าเป็นสินค้าที่ผ่านการรับรองจากผู้ผลิตที่เข้าร่วมโครงการ
                </p>
              </div>

              <div>
                <h4 className="text-base font-medium text-gray-900 mb-2">
                  ทำไมผลการค้นหาถึงไม่พบสินค้าของฉัน?
                </h4>
                <p className="text-gray-600">
                  อาจเกิดจากหลายสาเหตุ เช่น รหัสสินค้าไม่ถูกต้อง,
                  ผู้ผลิตสินค้ายังไม่ได้เข้าร่วมโครงการ VeriFact,
                  หรือสินค้านั้นอาจเป็นของปลอม
                  กรุณาตรวจสอบรหัสสินค้าอีกครั้งหรือติดต่อผู้ขายเพื่อขอข้อมูลเพิ่มเติม
                </p>
              </div>

              <div>
                <h4 className="text-base font-medium text-gray-900 mb-2">
                  ฉันไม่มีกระเป๋าเงินดิจิทัล จะตรวจสอบสินค้าได้หรือไม่?
                </h4>
                <p className="text-gray-600">
                  ได้ คุณสามารถตรวจสอบสินค้าได้โดยไม่ต้องเชื่อมต่อกระเป๋าเงิน
                  แต่การเชื่อมต่อกระเป๋าเงินจะช่วยให้คุณเข้าถึงฟีเจอร์เพิ่มเติม
                  เช่น การดูประวัติแบบละเอียด
                  หรือการรับกรรมสิทธิ์ในสินค้าดิจิทัล
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
