"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWeb3 } from "@/contexts/Web3Context";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { formatDate } from "@/utils/format";

export default function SellerDashboardPage() {
  const [sellerInfo, setSellerInfo] = useState(null);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    productName: "",
    productModel: "",
    serialNumber: "",
    initialPrice: "",
  });

  const { verifactContract, account, isConnected } = useWeb3();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchSellerData = async () => {
      if (!verifactContract || !account || !isConnected) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // ตรวจสอบว่าเป็นผู้ขายหรือไม่
        const isSeller = await verifactContract.methods
          .isSeller(account)
          .call();

        if (!isSeller) {
          router.push("/register-seller");
          return;
        }

        // ดึงข้อมูลผู้ขาย
        const seller = await verifactContract.methods
          .getSellerInfo(account)
          .call();

        setSellerInfo(seller);

        // ดึงสินค้าที่ลงทะเบียนโดยผู้ขายรายนี้
        const productIds = await verifactContract.methods
          .getProductsRegisteredBySeller(account)
          .call();

        // ดึงข้อมูลสินค้าแต่ละชิ้น
        const products = await Promise.all(
          productIds.map(async (id) => {
            return await verifactContract.methods.getProduct(id).call();
          })
        );

        setSellerProducts(products);
      } catch (err) {
        console.error("Error fetching seller data:", err);
        showError("ไม่สามารถดึงข้อมูลร้านค้าได้");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSellerData();
  }, [verifactContract, account, isConnected, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleRegisterProduct = async (e) => {
    e.preventDefault();

    // รวมรายละเอียดสินค้าในรูปแบบที่กำหนด
    const details = `${formData.productName} | ${formData.productModel} | ${formData.serialNumber}`;

    setIsLoading(true);
    try {
      await verifactContract.methods
        .registerProduct(details, formData.initialPrice)
        .send({ from: account });

      showSuccess("ลงทะเบียนสินค้าสำเร็จ");

      // รีเซ็ตฟอร์ม
      setFormData({
        productName: "",
        productModel: "",
        serialNumber: "",
        initialPrice: "",
      });

      // โหลดข้อมูลใหม่
      const productIds = await verifactContract.methods
        .getProductsRegisteredBySeller(account)
        .call();

      const products = await Promise.all(
        productIds.map(async (id) => {
          return await verifactContract.methods.getProduct(id).call();
        })
      );

      setSellerProducts(products);
    } catch (err) {
      console.error("Error registering product:", err);
      showError("เกิดข้อผิดพลาดในการลงทะเบียนสินค้า");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetProductStatus = async (productId, isActive) => {
    try {
      setIsLoading(true);
      await verifactContract.methods
        .setProductStatus(productId, isActive)
        .send({ from: account });

      showSuccess(`${isActive ? "เปิดใช้งาน" : "ระงับ"}สินค้าสำเร็จ`);

      // รีโหลดข้อมูลสินค้า
      const productIds = await verifactContract.methods
        .getProductsRegisteredBySeller(account)
        .call();

      const products = await Promise.all(
        productIds.map(async (id) => {
          return await verifactContract.methods.getProduct(id).call();
        })
      );

      setSellerProducts(products);
    } catch (error) {
      console.error("Error setting product status:", error);
      showError(`ไม่สามารถ${isActive ? "เปิดใช้งาน" : "ระงับ"}สินค้าได้`);
    } finally {
      setIsLoading(false);
    }
  };

  // ถ้ายังไม่ได้เชื่อมต่อกระเป๋าเงิน
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">เชื่อมต่อกระเป๋าเงิน</h2>
          <p className="text-gray-600 mb-6">
            กรุณาเชื่อมต่อกระเป๋าเงินเพื่อเข้าถึงหน้าผู้ขาย
          </p>
          <button
            onClick={() => router.push("/auth/login")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            เข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  // ถ้ากำลังโหลดข้อมูล
  if (isLoading && !sellerInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
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
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ส่วนภาพรวมร้านค้า */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              {sellerInfo ? sellerInfo.storeName : "ร้านค้าของฉัน"}
            </h2>
            <Link href="/profile" className="text-blue-600 hover:text-blue-800">
              แก้ไขโปรไฟล์
            </Link>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="bg-gray-50 rounded-lg p-4 flex-1">
              <h3 className="text-lg font-semibold mb-2">สินค้าทั้งหมด</h3>
              <p className="text-3xl font-bold text-blue-600">
                {sellerProducts.length}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 flex-1">
              <h3 className="text-lg font-semibold mb-2">สินค้าแอคทีฟ</h3>
              <p className="text-3xl font-bold text-green-600">
                {sellerProducts.filter((p) => p.isActive).length}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 flex-1">
              <h3 className="text-lg font-semibold mb-2">สินค้าถูกระงับ</h3>
              <p className="text-3xl font-bold text-red-600">
                {sellerProducts.filter((p) => !p.isActive).length}
              </p>
            </div>
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
          <h2 className="text-xl font-semibold mb-4">รายการสินค้าของร้าน</h2>

          {sellerProducts.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded">
              <p className="text-gray-500">
                ยังไม่มีสินค้าในระบบ กรุณาลงทะเบียนสินค้าใหม่
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      รหัส
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      รายละเอียด
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ราคา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      เจ้าของปัจจุบัน
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การจัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sellerProducts.map((product) => (
                    <tr key={product.productId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.productId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.details}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.initialPrice} บาท
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.currentOwner.toLowerCase() ===
                        account.toLowerCase()
                          ? "ร้านของฉัน"
                          : `${product.currentOwner.substring(
                              0,
                              6
                            )}...${product.currentOwner.substring(
                              product.currentOwner.length - 4
                            )}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.isActive ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            แอคทีฟ
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            ถูกระงับ
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            href={`/verify/${product.productId}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            ตรวจสอบ
                          </Link>

                          {/* ปุ่มระงับหรือเปิดใช้งานสินค้า */}
                          {product.isActive ? (
                            <button
                              onClick={() =>
                                handleSetProductStatus(product.productId, false)
                              }
                              className="text-red-600 hover:text-red-900"
                            >
                              ระงับ
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleSetProductStatus(product.productId, true)
                              }
                              className="text-green-600 hover:text-green-900"
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
          )}
        </div>
      </div>
    </main>
  );
}
