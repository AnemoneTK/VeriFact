"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useWeb3 } from "./Web3Context";
import { signIn, signOut as nextAuthSignOut } from "next-auth/react";

// สร้าง Context สำหรับการจัดการ Authentication
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const {
    account,
    isConnected,
    connectWallet,
    disconnectWallet,
    error: web3Error,
    formatAddress,
  } = useWeb3();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // อัปเดตสถานะผู้ใช้เมื่อมีการเปลี่ยนแปลงใน account
  useEffect(() => {
    if (isConnected && account) {
      // มีการเชื่อมต่อ wallet
      setUser({
        id: account,
        address: account,
        name: formatAddress
          ? formatAddress(account)
          : `${account.slice(0, 6)}...${account.slice(-4)}`,
        email: null,
        image: null,
      });
      setLoading(false);
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [account, isConnected, formatAddress]);

  // อัปเดตข้อผิดพลาดจาก Web3Context
  useEffect(() => {
    if (web3Error) {
      setError(web3Error);
    }
  }, [web3Error]);

  // ฟังก์ชันเข้าสู่ระบบด้วย wallet
  const login = async () => {
    console.log("กำลังเริ่มการเข้าสู่ระบบ");
    setLoading(true);
    setError(null);

    try {
      // เชื่อมต่อกับ wallet ก่อน
      console.log("กำลังเชื่อมต่อกับ wallet");
      let walletAddress;

      try {
        walletAddress = await connectWallet();
        console.log("เชื่อมต่อกับ wallet สำเร็จ:", walletAddress);
      } catch (walletError) {
        console.error("ไม่สามารถเชื่อมต่อกับ wallet ได้:", walletError);
        // กรณีผู้ใช้ยกเลิกการเชื่อมต่อ
        if (
          walletError &&
          (walletError.code === 4001 ||
            (walletError.message &&
              (walletError.message.includes("ผู้ใช้ยกเลิก") ||
                walletError.message.includes("User denied") ||
                walletError.message.includes("user rejected"))))
        ) {
          throw new Error("ผู้ใช้ยกเลิกการเชื่อมต่อ");
        }

        // ในกรณีที่ connectWallet ล้มเหลวแต่ไม่มีข้อความแสดงข้อผิดพลาด
        if (isConnected && account) {
          console.log("ตรวจพบว่าเชื่อมต่อแล้ว, ใช้บัญชีปัจจุบัน:", account);
          walletAddress = account;
        } else {
          throw walletError || new Error("ไม่สามารถเชื่อมต่อกับ wallet ได้");
        }
      }

      if (!walletAddress) {
        console.error("ไม่มี wallet address");
        throw new Error("ไม่สามารถดึงที่อยู่ wallet ได้");
      }

      try {
        // เข้าสู่ระบบด้วย NextAuth โดยใช้ address
        console.log("กำลังเข้าสู่ระบบด้วย NextAuth, address:", walletAddress);
        const result = await signIn("credentials", {
          address: walletAddress,
          redirect: false,
        });

        if (result?.error) {
          console.error("เข้าสู่ระบบไม่สำเร็จ:", result.error);

          // ถ้า wallet เชื่อมต่อแล้ว ให้ถือว่าเข้าสู่ระบบสำเร็จแม้ว่า NextAuth จะมีปัญหา
          if (isConnected && account) {
            console.log(
              "ข้ามการเข้าสู่ระบบด้วย NextAuth เนื่องจากเชื่อมต่อ wallet แล้ว"
            );
            return true;
          }

          throw new Error(result.error);
        }
      } catch (authError) {
        console.error("ข้อผิดพลาดในการเรียกใช้ NextAuth:", authError);

        // แม้ NextAuth จะมีปัญหา แต่ถ้ามีการเชื่อมต่อ wallet แล้ว ให้ถือว่าเข้าสู่ระบบสำเร็จ
        if (isConnected && account) {
          console.log(
            "ข้ามการเข้าสู่ระบบด้วย NextAuth เนื่องจากเชื่อมต่อ wallet แล้ว"
          );
          return true;
        }

        throw new Error(
          authError.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย NextAuth"
        );
      }

      console.log("เข้าสู่ระบบสำเร็จ");
      return true;
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ:", error);

      // กรณีผู้ใช้ยกเลิกการเชื่อมต่อ
      if (
        error &&
        (error.code === 4001 ||
          (error.message &&
            (error.message.includes("ผู้ใช้ยกเลิก") ||
              error.message.includes("User denied") ||
              error.message.includes("user rejected"))))
      ) {
        setError("ผู้ใช้ยกเลิกการเชื่อมต่อ");
      } else {
        setError(error.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      }

      return false;
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันออกจากระบบ
  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("กำลังออกจากระบบ...");

      // ลบค่าใน localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("walletConnected");
      }

      // ตัดการเชื่อมต่อ wallet
      console.log("กำลังตัดการเชื่อมต่อ wallet");
      await disconnectWallet();

      // ออกจากระบบ NextAuth
      try {
        console.log("กำลังออกจากระบบ NextAuth");
        await nextAuthSignOut({ redirect: false });
      } catch (authError) {
        console.error("เกิดข้อผิดพลาดในการออกจากระบบ NextAuth:", authError);
        // ถ้า NextAuth มีปัญหา ก็ไม่เป็นไร เพราะเราได้ตัดการเชื่อมต่อ wallet แล้ว
      }

      setUser(null);
      console.log("ออกจากระบบสำเร็จ");
      return true;
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการออกจากระบบ:", error);
      setError(error.message || "เกิดข้อผิดพลาดในการออกจากระบบ");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันลบข้อผิดพลาด
  const clearError = () => {
    setError(null);
  };

  // ค่าที่ส่งไปให้ผู้ใช้งาน Context
  const value = {
    user,
    loading,
    error,
    signIn: login,
    signOut: logout,
    isAuthenticated: !!user,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
