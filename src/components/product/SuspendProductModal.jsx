// src/components/product/SuspendProductModal.jsx
import React, { useState } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { useToast } from '@/contexts/ToastContext';

/**
 * คอมโพเนนต์ Modal สำหรับยืนยันการระงับ/เปิดใช้งานสินค้า
 * 
 * @param {Object} props - คุณสมบัติของคอมโพเนนต์
 * @param {boolean} props.isOpen - สถานะการแสดง Modal
 * @param {Function} props.onClose - ฟังก์ชันที่เรียกเมื่อปิด Modal
 * @param {string} props.productId - รหัสสินค้า
 * @param {string} props.productName - ชื่อสินค้า
 * @param {boolean} props.isActive - สถานะปัจจุบันของสินค้า (true: แอคทีฟ, false: ไม่แอคทีฟ)
 * @param {Function} props.onStatusChange - ฟังก์ชันที่เรียกเมื่อสถานะเปลี่ยน
 */
export default function SuspendProductModal({
  isOpen,
  onClose,
  productId,
  productName,
  isActive,
  onStatusChange
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [reason, setReason] = useState('');
  
  const { verifactContract, account } = useWeb3();
  const { showSuccess, showError } = useToast();

  // ตรวจสอบว่า Modal เปิดอยู่หรือไม่
  if (!isOpen) return null;

  // ฟังก์ชันดำเนินการเปลี่ยนสถานะ
  const handleToggleStatus = async () => {
    if (!verifactContract || !account || !productId) return;
    
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
      
      // เรียกฟังก์ชัน callback เพื่ออัปเดตสถานะ
      if (onStatusChange) {
        onStatusChange(!isActive);
      }
      
      // ปิด Modal
      onClose();
    } catch (err) {
      console.error("Error toggling product status:", err);
      showError(`เกิดข้อผิดพลาดในการ${isActive ? 'ระงับ' : 'เปิดใช้งาน'}สินค้า: ${err.message || "โปรดลองอีกครั้ง"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        {/* ปุ่มปิด */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          disabled={isProcessing}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        
        {/* หัวข้อ */}
        <div className="text-center mb-6">
          {isActive ? (
            <div className="bg-red-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          ) : (
            <div className="bg-green-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          )}
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isActive ? "ระงับสินค้า" : "เปิดใช้งานสินค้า"}
          </h3>
          <p className="text-gray-600 mb-4">
            {isActive 
              ? `คุณกำลังจะระงับสินค้า "${productName || productId}" ซึ่งจะไม่สามารถโอนหรือซื้อขายได้จนกว่าจะเปิดใช้งานอีกครั้ง` 
              : `คุณกำลังจะเปิดใช้งานสินค้า "${productName || productId}" เพื่อให้สามารถโอนและซื้อขายได้อีกครั้ง`}
          </p>
        </div>
        
        {/* ฟอร์มเหตุผล (อาจเพิ่มในอนาคต) */}
        {isActive && (
          <div className="mb-6">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              เหตุผลในการระงับ (ไม่บังคับ)
            </label>
            <textarea
              id="reason"
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="ระบุเหตุผลในการระงับสินค้า (ไม่บังคับ)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isProcessing}
            ></textarea>
            <p className="mt-1 text-xs text-gray-500">
              หมายเหตุ: เหตุผลนี้จะไม่ถูกบันทึกลงในบล็อกเชน
            </p>
          </div>
        )}
        
        {/* ปุ่มยืนยัน */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleToggleStatus}
            disabled={isProcessing}
            className={`flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
              isActive 
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังดำเนินการ...
              </div>
            ) : isActive ? "ยืนยันการระงับ" : "ยืนยันการเปิดใช้งาน"}
          </button>
          
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}