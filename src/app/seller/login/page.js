// src/app/seller/login/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWeb3 } from "@/contexts/Web3Context";
import { useToast } from "@/contexts/ToastContext";

export default function SellerLogin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const { verifactContract, account, isConnected, connectWallet } = useWeb3();
  const { showSuccess, showError } = useToast();
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      if (!verifactContract || !account) return;

      try {
        setIsChecking(true);
        const adminAddress = await verifactContract.methods.admin().call();
        const isUserAdmin =
          account.toLowerCase() === adminAddress.toLowerCase();
        setIsAdmin(isUserAdmin);

        if (isUserAdmin) {
          showSuccess("ยืนยันตัวตนสำเร็จ");
          router.push("/seller/dashboard");
        }
      } catch (error) {
        console.error("Error checking admin:", error);
        showError("เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์");
      } finally {
        setIsChecking(false);
      }
    };

    if (isConnected) {
      checkAdmin();
    } else {
      setIsChecking(false);
    }
  }, [verifactContract, account, isConnected]);

  const handleLogin = async () => {
    if (isConnected) {
      // ถ้าเชื่อมต่อแล้ว ให้ตรวจสอบสิทธิ์
      const adminAddress = await verifactContract.methods.admin().call();
      if (account.toLowerCase() === adminAddress.toLowerCase()) {
        showSuccess("ยืนยันตัวตนสำเร็จ");
        router.push("/seller/dashboard");
      } else {
        showError("คุณไม่มีสิทธิ์เข้าถึงหน้าผู้ขาย");
      }
    } else {
      // ถ้ายังไม่เชื่อมต่อ ให้เชื่อมต่อก่อน
      await connectWallet();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
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
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            เข้าสู่ระบบผู้ขาย
          </h2>
          <p className="mt-2 text-gray-600">
            เชื่อมต่อกระเป๋าเงินของคุณเพื่อเข้าสู่ระบบผู้ขาย
          </p>
        </div>

        {isChecking ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
          </div>
        ) : (
          <>
            <button
              onClick={handleLogin}
              className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isConnected ? "ยืนยันตัวตน" : "เชื่อมต่อกระเป๋าเงิน"}
            </button>

            {isConnected && !isAdmin && (
              <div className="mt-4 p-4 bg-red-50 rounded-md">
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
                    <h3 className="text-sm font-medium text-red-800">
                      ไม่มีสิทธิ์เข้าถึง
                    </h3>
                    <p className="text-sm text-red-700 mt-1">
                      กระเป๋าเงินนี้ไม่มีสิทธิ์เข้าถึงหน้าผู้ขาย
                      กรุณาใช้กระเป๋าเงินของผู้ดูแลระบบ
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
