"use client";

import { SessionProvider } from "next-auth/react";
import { Web3Provider } from "@/contexts/Web3Context";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";

export function Providers({ children }) {
  return (
    <SessionProvider>
      <Web3Provider>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </Web3Provider>
    </SessionProvider>
  );
}
