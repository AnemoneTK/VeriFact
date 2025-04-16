"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useWeb3 } from "./Web3Context";
import {
  signIn as nextAuthSignIn,
  signOut as nextAuthSignOut,
  useSession,
} from "next-auth/react";

// Create Context for Authentication
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

  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Update user state when session or account changes
  useEffect(() => {
    if (session?.user) {
      // If we have a session from NextAuth, use that
      setUser(session.user);
      setLoading(false);
    } else if (isConnected && account) {
      // If no session but wallet is connected, create a user object
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
  }, [session, account, isConnected, formatAddress]);

  // Update error from Web3Context
  useEffect(() => {
    if (web3Error) {
      setError(web3Error);
    }
  }, [web3Error]);

  // Sign in function
  const login = async () => {
    console.log("Starting login process");
    setLoading(true);
    setError(null);

    try {
      // First connect wallet
      console.log("Connecting to wallet");
      let walletAddress;

      try {
        walletAddress = await connectWallet();
        console.log("Wallet connected successfully:", walletAddress);
      } catch (walletError) {
        console.error("Error connecting wallet:", walletError);

        // Handle user cancellation
        if (
          walletError?.code === 4001 ||
          (walletError?.message &&
            (walletError.message.includes("User denied") ||
              walletError.message.includes("user rejected")))
        ) {
          throw new Error("ผู้ใช้ยกเลิกการเชื่อมต่อ");
        }

        // If wallet is already connected
        if (isConnected && account) {
          console.log("Already connected, using current account:", account);
          walletAddress = account;
        } else {
          throw walletError || new Error("ไม่สามารถเชื่อมต่อกับ wallet ได้");
        }
      }

      if (!walletAddress) {
        console.error("No wallet address available");
        throw new Error("ไม่สามารถดึงที่อยู่ wallet ได้");
      }

      try {
        // Sign in with NextAuth using the wallet address
        console.log("Signing in with NextAuth, address:", walletAddress);
        const result = await nextAuthSignIn("credentials", {
          address: walletAddress,
          redirect: false,
        });

        if (result?.error) {
          console.error("NextAuth sign in failed:", result.error);

          // If wallet is connected but NextAuth fails, still consider logged in
          if (isConnected && account) {
            console.log("Skipping NextAuth due to wallet connection");
            return true;
          }

          throw new Error(result.error);
        }
      } catch (authError) {
        console.error("Error calling NextAuth:", authError);

        // If wallet is connected but NextAuth has problems, still consider logged in
        if (isConnected && account) {
          console.log("Skipping NextAuth due to wallet connection");
          return true;
        }

        throw new Error(
          authError.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย NextAuth"
        );
      }

      console.log("Login successful");
      return true;
    } catch (error) {
      console.error("Login error:", error);

      // User cancellation handling
      if (
        error?.code === 4001 ||
        (error?.message &&
          (error.message.includes("ผู้ใช้ยกเลิก") ||
            error.message.includes("User denied") ||
            error.message.includes("user rejected")))
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

  // Sign out function
  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Logging out...");

      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("walletConnected");
      }

      // Disconnect wallet
      console.log("Disconnecting wallet");
      await disconnectWallet();

      // Sign out from NextAuth
      try {
        console.log("Signing out from NextAuth");
        await nextAuthSignOut({ redirect: false });
      } catch (authError) {
        console.error("Error signing out from NextAuth:", authError);
        // Continue even if NextAuth has issues, as we've disconnected the wallet
      }

      setUser(null);
      console.log("Logout successful");
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      setError(error.message || "เกิดข้อผิดพลาดในการออกจากระบบ");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Context value
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
