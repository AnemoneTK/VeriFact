"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWeb3 } from "@/contexts/Web3Context";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export default function ConnectWalletButton() {
  const { connectWallet, account, isConnected, disconnectWallet } = useWeb3();
  const { signIn, signOut, user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isLinking, setIsLinking] = useState(false);
  const router = useRouter();

  // ฟังก์ชันสำหรับการเชื่อมต่อ wallet และเข้าสู่ระบบ
  const handleConnectWallet = async () => {
    try {
      setIsLinking(true);
      // เชื่อมต่อ wallet ผ่าน Web3Context
      await connectWallet();

      // เมื่อเชื่อมต่อ wallet สำเร็จ ให้เข้าสู่ระบบด้วย AuthContext
      if (account) {
        await signIn();
        showSuccess("เชื่อมต่อกระเป๋าเงินสำเร็จ");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      showError("เกิดข้อผิดพลาดในการเชื่อมต่อกระเป๋าเงิน");
    } finally {
      setIsLinking(false);
    }
  };

  // ฟังก์ชันสำหรับออกจากระบบ
  const handleDisconnect = async () => {
    try {
      await signOut();
      await disconnectWallet();
      showSuccess("ตัดการเชื่อมต่อกระเป๋าเงินแล้ว");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      showError("เกิดข้อผิดพลาดในการตัดการเชื่อมต่อ");
    }
  };

  // ฟังก์ชันย่อที่อยู่กระเป๋าเงิน
  const truncateAddress = (address, startLength = 6, endLength = 4) => {
    if (!address) return "";
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
  };

  if (isConnected && account) {
    return (
      <div className="flex items-center space-x-2">
        <button
          className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-800 py-1.5 px-3 rounded-full text-sm transition-colors"
          onClick={() => router.push("/dashboard")}
        >
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="font-mono">{truncateAddress(account)}</span>
        </button>

        <button
          onClick={handleDisconnect}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 p-1.5 rounded-full"
          title="ออกจากระบบ"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnectWallet}
      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
      disabled={isLinking}
    >
      {isLinking ? (
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
          กำลังเชื่อมต่อ...
        </>
      ) : (
        <>
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
        </>
      )}
    </button>
  );
}
