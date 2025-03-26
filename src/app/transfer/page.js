// src/app/transfer/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useWeb3 } from "@/contexts/Web3Context";
import { useAuth } from "@/contexts/AuthContext";

export default function TransferPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialProductId = searchParams.get("productId") || "";

  const [productId, setProductId] = useState(initialProductId);
  const [receiverAddress, setReceiverAddress] = useState("");
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [productDetails, setProductDetails] = useState(null);
  const [userProducts, setUserProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(initialProductId);

  const { verifactContract, account, isConnected, connectWallet } = useWeb3();
  const { user } = useAuth();

  useEffect(() => {
    if (initialProductId) {
      fetchProductDetails(initialProductId);
    }
    if (isConnected && account && verifactContract) {
      fetchUserProducts();
    }
  }, [initialProductId, isConnected, account, verifactContract]);

  const fetchProductDetails = async (id) => {
    if (!isConnected || !verifactContract) return;

    try {
      const product = await verifactContract.methods.getProduct(id).call();

      // ตรวจสอบว่าผู้ใช้ปัจจุบันเป็นเจ้าของสินค้านี้หรือไม่
      if (product.currentOwner.toLowerCase() !== account.toLowerCase()) {
        setError("คุณไม่ใช่เจ้าของสินค้านี้ ไม่สามารถโอนได้");
        setProductDetails(null);
      } else {
        setProductDetails(product);
        setSelectedProduct(id);
        setProductId(id);
        setError("");
      }
    } catch (err) {
      console.error("Error fetching product details:", err);
      setError("ไม่สามารถดึงข้อมูลสินค้าได้ โปรดลองอีกครั้ง");
      setProductDetails(null);
    }
  };

  const fetchUserProducts = async () => {
    try {
      const productIds = await verifactContract.methods
        .getProductsByOwner(account)
        .call();

      // ดึงข้อมูลสินค้าแต่ละชิ้น
      const products = await Promise.all(
        productIds.map(async (id) => {
          const product = await verifactContract.methods.getProduct(id).call();
          return { id, details: product.details, isActive: product.isActive };
        })
      );

      setUserProducts(products.filter((p) => p.isActive));
    } catch (err) {
      console.error("Error fetching user products:", err);
    }
  };

  const handleProductChange = (e) => {
    const id = e.target.value;
    setSelectedProduct(id);
    if (id) {
      fetchProductDetails(id);
    } else {
      setProductDetails(null);
      setProductId("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!productId || !receiverAddress || !price) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(receiverAddress)) {
      setError("รูปแบบที่อยู่กระเป๋าเงินไม่ถูกต้อง");
      return;
    }

    if (receiverAddress.toLowerCase() === account.toLowerCase()) {
      setError("คุณไม่สามารถโอนสินค้าให้ตัวเอง");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // ตรวจสอบว่าผู้ใช้ปัจจุบันเป็นเจ้าของสินค้า
      const product = await verifactContract.methods
        .getProduct(productId)
        .call();

      if (product.currentOwner.toLowerCase() !== account.toLowerCase()) {
        throw new Error("คุณไม่ใช่เจ้าของสินค้านี้ ไม่สามารถโอนได้");
      }

      // ดำเนินการโอนสินค้า
      await verifactContract.methods
        .transferProduct(productId, receiverAddress, price)
        .send({ from: account });

      setSuccess("โอนสินค้าสำเร็จ!");
      setReceiverAddress("");
      setPrice("");

      // ล้างหน้าฟอร์มหลังจากการโอนสำเร็จ
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (err) {
      console.error("Error transferring product:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการโอนสินค้า โปรดลองอีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

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
                คุณต้องเข้าสู่ระบบเพื่อโอนสินค้า
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
                กรุณาเชื่อมต่อกระเป๋าเงินของคุณเพื่อโอนสินค้า
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
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <Link
            href="/dashboard"
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
            กลับไปที่แดชบอร์ด
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">โอนสินค้า</h1>

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
                htmlFor="productSelect"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                เลือกสินค้า
              </label>
              <select
                id="productSelect"
                value={selectedProduct}
                onChange={handleProductChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">-- เลือกสินค้า --</option>
                {userProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.details.split("|")[0] || product.id}
                  </option>
                ))}
              </select>
            </div>

            {productDetails && (
              <div className="bg-gray-50 rounded-md p-4 mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  รายละเอียดสินค้า
                </h3>
                <p className="text-sm text-gray-600">
                  รหัสสินค้า: {productDetails.productId}
                </p>
                <p className="text-sm text-gray-600">
                  รายละเอียด: {productDetails.details}
                </p>
              </div>
            )}

            <div className="mb-6">
              <label
                htmlFor="receiverAddress"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                ที่อยู่กระเป๋าเงินผู้รับ
              </label>
              <input
                type="text"
                id="receiverAddress"
                value={receiverAddress}
                onChange={(e) => setReceiverAddress(e.target.value)}
                placeholder="0x..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                ตัวอย่าง: 0x1234...5678
              </p>
            </div>

            <div className="mb-6">
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                ราคาโอน (บาท)
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
              <p className="mt-1 text-xs text-gray-500">
                ระบุ 0 กรณีโอนให้โดยไม่มีค่าใช้จ่าย
              </p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    การโอนสินค้าไม่สามารถยกเลิกได้
                    โปรดตรวจสอบที่อยู่กระเป๋าเงินผู้รับให้ถูกต้อง
                  </p>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || !productId}
                className="w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? "กำลังดำเนินการ..." : "โอนสินค้า"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
