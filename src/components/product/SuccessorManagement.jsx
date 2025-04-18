// สร้างไฟล์ src/components/product/SuccessorManagement.jsx
import { useState } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { useToast } from '@/contexts/ToastContext';

export default function SuccessorManagement({ productId, currentSuccessor, refreshData }) {
  const [successorAddress, setSuccessorAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { setSuccessor, verifactContract, account } = useWeb3();
  const { showSuccess, showError } = useToast();
  
  const handleSetSuccessor = async (e) => {
    e.preventDefault();
    
    if (!successorAddress) {
      showError('กรุณากรอกที่อยู่กระเป๋าเงินผู้รับสืบทอด');
      return;
    }
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(successorAddress)) {
      showError('รูปแบบที่อยู่กระเป๋าเงินไม่ถูกต้อง');
      return;
    }
    
    if (successorAddress.toLowerCase() === account.toLowerCase()) {
      showError('คุณไม่สามารถตั้งตัวเองเป็นผู้รับสืบทอด');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await verifactContract.methods
        .setSuccessor(productId, successorAddress)
        .send();
        
      showSuccess('ตั้งค่าผู้รับสืบทอดสำเร็จ');
      setSuccessorAddress('');
      
      // รีเฟรชข้อมูลหลังจากตั้งค่าสำเร็จ
      if (refreshData) refreshData();
    } catch (error) {
      console.error('Error setting successor:', error);
      showError(`เกิดข้อผิดพลาดในการตั้งค่าผู้รับสืบทอด: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveSuccessor = async () => {
    if (!currentSuccessor) return;
    
    setIsLoading(true);
    
    try {
      await verifactContract.methods
        .removeSuccessor(productId)
        .send();
        
      showSuccess('ยกเลิกผู้รับสืบทอดสำเร็จ');
      
      // รีเฟรชข้อมูลหลังจากยกเลิกสำเร็จ
      if (refreshData) refreshData();
    } catch (error) {
      console.error('Error removing successor:', error);
      showError(`เกิดข้อผิดพลาดในการยกเลิกผู้รับสืบทอด: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">จัดการผู้รับสืบทอด</h3>
      
      {currentSuccessor && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            ผู้รับสืบทอดปัจจุบัน: <span className="font-medium">{`${currentSuccessor.substring(0, 8)}...${currentSuccessor.substring(currentSuccessor.length - 6)}`}</span>
          </p>
          <button
            onClick={handleRemoveSuccessor}
            disabled={isLoading}
            className="mt-2 px-3 py-1 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition"
          >
            ยกเลิกผู้รับสืบทอด
          </button>
        </div>
      )}
      
      <form onSubmit={handleSetSuccessor}>
        <div className="mb-4">
          <label htmlFor="successorAddress" className="block text-sm font-medium text-gray-700 mb-1">
            ที่อยู่กระเป๋าเงินผู้รับสืบทอด
          </label>
          <input
            type="text"
            id="successorAddress"
            value={successorAddress}
            onChange={(e) => setSuccessorAddress(e.target.value)}
            placeholder="0x..."
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            ผู้รับสืบทอดจะสามารถรับโอนสินค้าในอนาคตได้ หากมีเหตุจำเป็น
          </p>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow-sm disabled:opacity-50"
        >
          {isLoading ? 'กำลังดำเนินการ...' : 'ตั้งผู้รับสืบทอด'}
        </button>
      </form>
    </div>
  );
}