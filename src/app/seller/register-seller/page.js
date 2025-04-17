"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWeb3 } from "@/contexts/Web3Context";
import { useToast } from "@/contexts/ToastContext";
import Link from "next/link";

export default function RegisterSellerPage() {
  const [storeName, setStoreName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { verifactContract, account, isConnected, connectWallet } = useWeb3();
  const { showSuccess, showError } = useToast();
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!storeName) {
      showError("กรุณากรอกชื่อร้านค้า");
      return;
    }

    if (!isConnected) {
      showError("กรุณาเชื่อมต่อกระเป๋าเงินก่อน");
      return;
    }

    setIsLoading(true);
    try {
      await verifactContract.methods
        .registerAsSeller(storeName)
        .send({ from: account });

      showSuccess("ลงทะเบียนร้านค้าสำเร็จ");
      router.push("/seller/dashboard");
    } catch (error) {
      console.error("Error registering as seller:", error);
      showError("เกิดข้อผิดพลาดในการลงทะเบียนร้านค้า");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-2xl font-bold text-center mb-6">
              ลงทะเบียนร้านค้า
            </h1>

            <form onSubmit={handleRegister}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อร้านค้า
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="ชื่อร้านค้าของคุณ"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !isConnected}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "กำลังดำเนินการ..." : "ลงทะเบียนร้านค้า"}
              </button>

              {!isConnected && (
                <button
                  type="button"
                  onClick={connectWallet}
                  className="w-full mt-3 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
                >
                  เชื่อมต่อกระเป๋าเงินก่อน
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
