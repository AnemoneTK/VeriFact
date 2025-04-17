// src/app/seller/add-product/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWeb3 } from "@/contexts/Web3Context";
import { useAuth } from "@/contexts/AuthContext";

export default function AddProductPage() {
  const [productId, setProductId] = useState("");
  const [details, setDetails] = useState("");
  const [price, setPrice] = useState("");
  const [initialOwner, setInitialOwner] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isManufacturer, setIsManufacturer] = useState(false);

  const { verifactContract, account, isConnected, connectWallet } = useWeb3();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isConnected && account && verifactContract) {
      checkManufacturerStatus();
    }
  }, [isConnected, account, verifactContract]);

  const checkManufacturerStatus = async () => {
    try {
      const status = await verifactContract.methods
        .manufacturers(account)
        .call();
      setIsManufacturer(status);
    } catch (err) {
      console.error("Error checking manufacturer status:", err);
    }
  };

  const generateProductId = () => {
    return `PROD-${Date.now()}`;
  };

  const handleRegisterProduct = async (e) => {
    e.preventDefault();

    // สร้าง productId อัตโนมัติหากไม่ได้ระบุ
    const productId = formData.productId || `PROD-${Date.now()}`;

    // รวมรายละเอียดสินค้า
    const details = `${formData.productName} | ${formData.productModel} | ${formData.serialNumber}`;

    try {
      const initialPrice = parseInt(formData.initialPrice, 10);

      const result = await verifactContract.registerProduct(
        productId,
        details,
        initialPrice
      );

      showSuccess(`ลงทะเบียนสินค้าสำเร็จ! รหัสสินค้า: ${productId}`);

      // รีเซ็ตฟอร์ม
      setFormData({
        productName: "",
        productModel: "",
        serialNumber: "",
        initialPrice: "",
      });

      // โหลดข้อมูลใหม่
      fetchProducts();
    } catch (error) {
      console.error("Error registering product:", error);
      showError(`เกิดข้อผิดพลาดในการลงทะเบียนสินค้า: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // เตรียมข้อมูล
    const productId = formData.productId || `PROD-${Date.now()}`;
    const details = `${formData.productName} | ${formData.productModel} | ${formData.serialNumber}`;
    const initialPrice = parseInt(formData.initialPrice, 10);

    // ตรวจสอบข้อมูลเบื้องต้น
    if (!productId || !details || !initialPrice) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // ตรวจสอบสถานะผู้ขาย
      const isManufacturer = await verifactContract.methods
        .isSeller(account)
        .call();

      if (!isManufacturer) {
        throw new Error("คุณไม่ได้รับอนุญาตให้เพิ่มสินค้า");
      }

      // ตรวจสอบว่ามีสินค้านี้อยู่แล้วหรือไม่
      try {
        await verifactContract.methods.getProduct(productId).call();
        throw new Error("รหัสสินค้านี้มีอยู่ในระบบแล้ว");
      } catch (checkError) {
        // ถ้า getProduct throw error แสดงว่ายังไม่มีสินค้า ให้ดำเนินการต่อ
        if (!checkError.message.includes("Product does not exist")) {
          throw checkError;
        }
      }

      // ลงทะเบียนสินค้า
      const result = await verifactContract.methods
        .registerProduct(productId, details, initialPrice)
        .send({ from: account });

      setSuccess(`เพิ่มสินค้าสำเร็จ! รหัสสินค้า: ${productId}`);

      // รีเซ็ตฟอร์ม
      setFormData({
        productName: "",
        productModel: "",
        serialNumber: "",
        initialPrice: "",
        productId: "",
      });

      // นำทางไปที่หน้ารายการสินค้า
      setTimeout(() => {
        router.push("/seller/products");
      }, 3000);
    } catch (err) {
      console.error("Error adding product:", err);

      // จัดการ error message ที่เป็นมิตร
      const errorMessage = err.message.includes("User denied transaction")
        ? "คุณยกเลิกการทำธุรกรรม"
        : err.message || "เกิดข้อผิดพลาดในการเพิ่มสินค้า โปรดลองอีกครั้ง";

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ถ้าผู้ใช้ยังไม่ได้เข้าสู่ระบบ
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
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
                คุณต้องเข้าสู่ระบบเพื่อเพิ่มสินค้า
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

  // ถ้าผู้ใช้ยังไม่ได้เชื่อมต่อกระเป๋าเงิน
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
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
                กรุณาเชื่อมต่อกระเป๋าเงินของคุณเพื่อเพิ่มสินค้า
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

  // ถ้าผู้ใช้ไม่ใช่ผู้ผลิตที่ได้รับอนุญาต
  if (!isManufacturer) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
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
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                ไม่ได้รับอนุญาต
              </h2>
              <p className="mt-2 text-gray-600">
                คุณไม่ได้รับอนุญาตให้เพิ่มสินค้า โปรดติดต่อผู้ดูแลระบบ
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  กลับไปที่แดชบอร์ด
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href="/seller"
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
            กลับไปที่หน้าผู้ขาย
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            เพิ่มสินค้าใหม่
          </h1>

          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

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

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="productId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                รหัสสินค้า *
              </label>
              <input
                type="text"
                id="productId"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="เช่น SKU12345"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                กรุณาระบุรหัสที่ไม่ซ้ำกันสำหรับการอ้างอิง
              </p>
            </div>

            <div className="mb-6">
              <label
                htmlFor="details"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                รายละเอียดสินค้า *
              </label>
              <textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="รายละเอียดสินค้า เช่น ชื่อ รุ่น ข้อมูลสำคัญ"
                rows={5}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                ใส่รายละเอียดที่สำคัญของสินค้า เช่น ยี่ห้อ รุ่น หมายเลขซีเรียล
                ฯลฯ
              </p>
            </div>

            <div className="mb-6">
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                ราคาเริ่มต้น (บาท) *
              </label>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="initialOwner"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                ที่อยู่กระเป๋าเงินเจ้าของเริ่มต้น (ถ้ามี)
              </label>
              <input
                type="text"
                id="initialOwner"
                value={initialOwner}
                onChange={(e) => setInitialOwner(e.target.value)}
                placeholder="0x..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                ปล่อยว่างเพื่อตั้งให้คุณเป็นเจ้าของเริ่มต้น
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? "กำลังดำเนินการ..." : "เพิ่มสินค้า"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
