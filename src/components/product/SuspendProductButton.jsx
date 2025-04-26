// src/components/product/SuspendProductButton.jsx
import { useState } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { useToast } from '@/contexts/ToastContext';

/**
 * คอมโพเนนต์ปุ่มระงับ/เปิดใช้งานสินค้า
 * 
 * @param {Object} props - คุณสมบัติของคอมโพเนนต์
 * @param {string} props.productId - รหัสสินค้า
 * @param {boolean} props.isActive - สถานะปัจจุบันของสินค้า (true: แอคทีฟ, false: ไม่แอคทีฟ)
 * @param {Function} props.onToggle - ฟังก์ชันที่เรียกเมื่อสถานะเปลี่ยน
 * @param {boolean} props.isAdmin - ระบุว่าผู้ใช้เป็นแอดมินหรือไม่
 * @param {boolean} props.isOriginalRegistrar - ระบุว่าผู้ใช้เป็นผู้ลงทะเบียนสินค้านี้หรือไม่
 * @param {boolean} props.isOwner - ระบุว่าผู้ใช้เป็นเจ้าของสินค้านี้หรือไม่
 */
export default function SuspendProductButton({
  productId,
  isActive,
  onToggle,
  isAdmin = false,
  isOriginalRegistrar = false,
  isOwner = false,
  className = ""
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { verifactContract, account } = useWeb3();
  const { showSuccess, showError } = useToast();

  // ตรวจสอบว่ามีสิทธิ์ในการระงับสินค้าหรือไม่
  const canToggleStatus = isAdmin || isOriginalRegistrar || isOwner;

  // ฟังก์ชันเปลี่ยนสถานะสินค้า
  const handleToggleStatus = async () => {
    if (!canToggleStatus || !verifactContract || !account) return;
    
    setIsProcessing(true);
    
    try {
      // เรียกฟังก์ชัน setProductStatus จาก Smart Contract
      await verifactContract.methods
        .setProductStatus(productId, !isActive)
        .send({ from: account });
      
      // แสดงข้อความสำเร็จ
      if (isActive) {
        showSuccess(`ระงับสินค้ารหัส ${productId} สำเร็จ`);
      } else {
        showSuccess(`เปิดใช้งานสินค้ารหัส ${productId} สำเร็จ`);
      }
      
      // เรียกฟังก์ชัน callback เพื่ออัปเดตสถานะในหน้า parent
      if (onToggle) {
        onToggle(!isActive);
      }
    } catch (err) {
      console.error("Error toggling product status:", err);
      showError(`เกิดข้อผิดพลาดในการ${isActive ? 'ระงับ' : 'เปิดใช้งาน'}สินค้า: ${err.message || "โปรดลองอีกครั้ง"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ถ้าไม่มีสิทธิ์ในการระงับสินค้า ไม่ต้องแสดงปุ่ม
  if (!canToggleStatus) {
    return null;
  }

  // คำนวณ class ของปุ่มตามสถานะ
  const buttonClass = isActive
    ? `inline-flex items-center px-2.5 py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 ${className}`
    : `inline-flex items-center px-2.5 py-1.5 border border-green-300 text-xs font-medium rounded-md text-green-700 bg-white hover:bg-green-50 ${className}`;

  return (
    <button
      onClick={handleToggleStatus}
      disabled={isProcessing}
      className={buttonClass}
      title={isActive ? "ระงับสินค้า" : "เปิดใช้งานสินค้า"}
    >
      {isProcessing ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          กำลังดำเนินการ...
        </>
      ) : isActive ? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
          ระงับ
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          เปิดใช้งาน
        </>
      )}
    </button>
  );
}