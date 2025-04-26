// src/components/product/ProductStatusBadge.jsx
import React from 'react';

/**
 * คอมโพเนนต์แสดงสถานะของสินค้า
 * 
 * @param {Object} props - คุณสมบัติของคอมโพเนนต์
 * @param {boolean} props.isActive - สถานะสินค้า (true: แอคทีฟ, false: ไม่แอคทีฟ)
 * @param {string} props.size - ขนาดของแบดจ์ ('sm', 'md', 'lg')
 * @param {string} props.className - คลาสเพิ่มเติม
 */
export default function ProductStatusBadge({ isActive, size = 'md', className = '' }) {
  // กำหนดสีและข้อความตามสถานะ
  const badgeColors = isActive
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800';
  
  const statusText = isActive ? 'แอคทีฟ' : 'ระงับแล้ว';
  
  // กำหนดขนาดตามพารามิเตอร์
  const sizeClasses = {
    'sm': 'px-2 py-0.5 text-xs',
    'md': 'px-2.5 py-1 text-xs',
    'lg': 'px-3 py-1.5 text-sm'
  };
  
  const sizeClass = sizeClasses[size] || sizeClasses['md'];
  
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${badgeColors} ${sizeClass} ${className}`}>
      {/* จุดสถานะ */}
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-600' : 'bg-red-600'} mr-1.5`}></span>
      {statusText}
    </span>
  );
}