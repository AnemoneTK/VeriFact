// src/contexts/ToastContext.jsx
"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import Toast from "@/components/ui/Toast";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // ฟังก์ชันเพิ่มการแจ้งเตือนใหม่
  const addToast = useCallback((message, type = "success", duration = 3000) => {
    const id = Date.now().toString();
    setToasts((prevToasts) => [...prevToasts, { id, message, type, duration }]);
    return id;
  }, []);

  // ฟังก์ชันลบการแจ้งเตือน
  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  // ฟังก์ชันสำหรับความสะดวกในการใช้งาน
  const showSuccess = useCallback(
    (message, duration) => addToast(message, "success", duration),
    [addToast]
  );
  const showError = useCallback(
    (message, duration) => addToast(message, "error", duration),
    [addToast]
  );
  const showWarning = useCallback(
    (message, duration) => addToast(message, "warning", duration),
    [addToast]
  );
  const showInfo = useCallback(
    (message, duration) => addToast(message, "info", duration),
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{
        addToast,
        removeToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
      {/* แสดงการแจ้งเตือนทั้งหมด */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Hook สำหรับการใช้งาน
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
