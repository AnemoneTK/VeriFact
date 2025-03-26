"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { useToast } from "@/contexts/ToastContext";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, signIn, error: authError, clearError } = useAuth();
  const {
    isConnected,
    account,
    checkIfWalletIsInstalled,
    error: web3Error,
  } = useWeb3();
  const { showSuccess, showError } = useToast();
  const [showMetaMaskBanner, setShowMetaMaskBanner] = useState(false);

  useEffect(() => {
    // ตรวจสอบว่ามี wallet ติดตั้งหรือไม่
    const walletInstalled = checkIfWalletIsInstalled();
    setShowMetaMaskBanner(!walletInstalled);

    // ถ้ามีการเข้าสู่ระบบแล้ว ให้นำทางไปยังหน้า dashboard
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router, checkIfWalletIsInstalled]);

  // จัดการข้อผิดพลาดจาก context
  useEffect(() => {
    if (authError) {
      showError(authError);
    }
    if (web3Error) {
      showError(web3Error);
    }

    // ล้างข้อผิดพลาดเมื่อ unmount
    return () => {
      if (clearError) clearError();
    };
  }, [authError, web3Error, showError, clearError]);

  const handleLogin = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      // ตรวจสอบว่ามี wallet ติดตั้งหรือไม่
      if (!checkIfWalletIsInstalled()) {
        showError(
          "MetaMask หรือ wallet อื่นๆ ไม่ได้ติดตั้ง กรุณาติดตั้งก่อนเข้าสู่ระบบ"
        );
        return;
      }

      const result = await signIn();

      if (result) {
        showSuccess("เข้าสู่ระบบสำเร็จ");
        router.push("/dashboard");
      } else {
        // จะมีการแสดง error จาก useEffect ที่ตรวจจับ authError อยู่แล้ว
      }
    } catch (err) {
      showError(err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-blue-600 p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-white"
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
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          เข้าสู่ระบบ VeriFact
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          เข้าสู่ระบบด้วย Wallet เพื่อจัดการสินค้าของคุณ
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* แบนเนอร์แนะนำให้ติดตั้ง MetaMask */}
          {showMetaMaskBanner && (
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
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h2a1 1 0 100-2H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    คุณจำเป็นต้องติดตั้ง MetaMask หรือ wallet อื่นๆ
                    ก่อนเข้าสู่ระบบ
                  </p>
                  <div className="mt-3">
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
                    >
                      ติดตั้ง MetaMask
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isConnected && account ? (
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
                  <p className="text-sm text-green-700">
                    เชื่อมต่อกับ Wallet แล้ว: {account.substring(0, 6)}...
                    {account.substring(account.length - 4)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div>
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
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
              )}
              {isConnected
                ? "เข้าสู่ระบบด้วย Wallet นี้"
                : "เชื่อมต่อ Wallet และเข้าสู่ระบบ"}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">หรือ</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <Link
                href="/"
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                กลับไปหน้าหลัก
              </Link>

              <Link
                href="/verify"
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ตรวจสอบสินค้าโดยไม่เข้าสู่ระบบ
              </Link>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-center text-xs text-gray-500">
              การเชื่อมต่อ Wallet และเข้าสู่ระบบ หมายถึงคุณยอมรับ{" "}
              <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                เงื่อนไขการใช้งาน
              </Link>{" "}
              และ{" "}
              <Link
                href="/privacy"
                className="text-blue-600 hover:text-blue-500"
              >
                นโยบายความเป็นส่วนตัว
              </Link>{" "}
              ของเรา
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
