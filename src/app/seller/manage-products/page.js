// src/app/admin/manage-products/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWeb3 } from "@/contexts/Web3Context";
import { useToast } from "@/contexts/ToastContext";
import Link from "next/link";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    details: "",
    initialPrice: "",
  });

  const { verifactContract, account, isConnected, isAdmin } = useWeb3();
  const { showError, showSuccess } = useToast();
  const router = useRouter();

  useEffect(() => {
    // ตรวจสอบว่าเป็นแอดมินหรือไม่
    if (isConnected && !isAdmin) {
      showError("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
      router.push("/dashboard");
    }

    if (isConnected && isAdmin) {
      fetchProducts();
      estimateNextProductId();
    }
  }, [isConnected, isAdmin, verifactContract]);

  const fetchProducts = async () => {
    if (!verifactContract || !account) return;

    try {
      setIsLoading(true);

      // ดึงรายการสินค้าที่แอดมินเป็นเจ้าของ
      const productIds = await verifactContract.methods
        .getProductsByOwner(account)
        .call();

      // ดึงข้อมูลสินค้าแต่ละชิ้น
      const productsList = await Promise.all(
        productIds.map(async (id) => {
          const product = await verifactContract.methods.getProduct(id).call();

          // ดึงประวัติการโอนเพื่อตรวจสอบว่าเป็นผู้ลงทะเบียนหรือไม่
          const history = await verifactContract.methods
            .getTransferHistory(id)
            .call();
          const isOriginalRegistrar =
            history.length > 0 &&
            history[0].from === "0x0000000000000000000000000000000000000000" &&
            history[0].to.toLowerCase() === account.toLowerCase();

          return {
            ...product,
            isOriginalRegistrar,
          };
        })
      );

      setProducts(productsList);
    } catch (error) {
      console.error("Error fetching products:", error);
      showError("ไม่สามารถดึงข้อมูลสินค้าได้");
    } finally {
      setIsLoading(false);
    }
  };

  // คาดการณ์ ID สินค้าถัดไป (อาจไม่แม่นยำ 100%)
  const estimateNextProductId = async () => {
    if (!verifactContract) return;

    try {
      // ลองดึงสินค้า ID ที่สูงๆ เพื่อดูว่าถึง ID ไหนแล้ว
      let id = 1;
      while (true) {
        try {
          await verifactContract.methods.getProduct(id).call();
          id++;
        } catch {
          break;
        }
      }
      setNextId(id);
    } catch (error) {
      console.error("Error estimating next product ID:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleRegisterProduct = async (e) => {
    e.preventDefault();

    if (!verifactContract || !account || !isAdmin) {
      showError("ไม่มีสิทธิ์เพียงพอ");
      return;
    }

    try {
      setIsLoading(true);

      // ลงทะเบียนสินค้าใหม่
      await verifactContract.methods
        .registerProduct(formData.details, formData.initialPrice)
        .send({ from: account });

      showSuccess("ลงทะเบียนสินค้าสำเร็จ");

      // รีเซ็ตฟอร์ม
      setFormData({
        details: "",
        initialPrice: "",
      });

      // โหลดข้อมูลใหม่
      fetchProducts();
      estimateNextProductId();
    } catch (error) {
      console.error("Error registering product:", error);
      showError("เกิดข้อผิดพลาดในการลงทะเบียนสินค้า");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferProduct = async (productId, newOwner, price) => {
    if (!verifactContract || !account || !isAdmin) {
      showError("ไม่มีสิทธิ์เพียงพอ");
      return;
    }

    try {
      setIsLoading(true);

      // โอนสินค้าให้กับผู้ซื้อ
      await verifactContract.methods
        .transferProduct(productId, newOwner, price)
        .send({ from: account });

      showSuccess("โอนสินค้าสำเร็จ");

      // โหลดข้อมูลใหม่
      fetchProducts();
    } catch (error) {
      console.error("Error transferring product:", error);
      showError("เกิดข้อผิดพลาดในการโอนสินค้า");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center p-8">
        <p>กรุณาเชื่อมต่อกระเป๋าเงิน</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center p-8">
        <p>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">จัดการสินค้า (Admin)</h1>

      {/* ส่วนลงทะเบียนสินค้าใหม่ */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">ลงทะเบียนสินค้าใหม่</h2>
        <p className="text-sm text-gray-500 mb-4">
          ID สินค้าถัดไป (คาดการณ์): {nextId}
        </p>

        <form onSubmit={handleRegisterProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              รายละเอียดสินค้า:
            </label>
            <input
              type="text"
              name="details"
              value={formData.details}
              onChange={handleInputChange}
              placeholder="ชื่อสินค้า | รุ่น | หมายเลขซีเรียล"
              className="w-full p-2 border rounded"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              แนะนำ: ใช้รูปแบบ ชื่อสินค้า | รุ่น | หมายเลขซีเรียล
              เพื่อให้อ่านง่าย
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              ราคาเริ่มต้น (บาท):
            </label>
            <input
              type="number"
              name="initialPrice"
              value={formData.initialPrice}
              onChange={handleInputChange}
              placeholder="0"
              min="1"
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "กำลังดำเนินการ..." : "ลงทะเบียนสินค้า"}
          </button>
        </form>
      </div>

      {/* ส่วนแสดงรายการสินค้า */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6">สินค้าทั้งหมด</h2>

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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รายละเอียด
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ราคา
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    เจ้าของปัจจุบัน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.isActive ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          แอคทีฟ
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          ไม่แอคทีฟ
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.currentOwner.toLowerCase() ===
                      account.toLowerCase()
                        ? "แอดมิน (คุณ)"
                        : `${product.currentOwner.substring(
                            0,
                            6
                          )}...${product.currentOwner.substring(
                            product.currentOwner.length - 4
                          )}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={`/verify/${product.productId}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          ตรวจสอบ
                        </Link>

                        {product.currentOwner.toLowerCase() ===
                          account.toLowerCase() && (
                          <Link
                            href={`/transfer?productId=${product.productId}`}
                            className="text-green-600 hover:text-green-900"
                          >
                            โอน
                          </Link>
                        )}

                        {product.isOriginalRegistrar && product.isActive && (
                          <button
                            onClick={() =>
                              verifactContract.methods
                                .setProductStatus(product.productId, false)
                                .send({ from: account })
                            }
                            className="text-red-600 hover:text-red-900"
                          >
                            ระงับ
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
          <div className="text-center py-8 bg-gray-50 rounded">
            <p className="text-gray-500">ยังไม่มีสินค้าในระบบ</p>
          </div>
        )}
      </div>
    </div>
  );
}
