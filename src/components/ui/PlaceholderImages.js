// components/PlaceholderImages.js
// ไฟล์นี้มีคอมโพเนนต์สำหรับภาพ placeholder ที่ใช้ในหน้า Homepage

import React from "react";

export const RegisterProductImage = ({ className = "w-full h-full" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 400 300"
    className={className}
  >
    {/* พื้นหลัง */}
    <rect width="400" height="300" fill="#f3f4f6" />

    {/* การ์ดกลาง */}
    <rect
      x="100"
      y="70"
      width="200"
      height="160"
      rx="12"
      fill="#ffffff"
      stroke="#4f46e5"
      strokeWidth="2"
      filter="drop-shadow(0px 4px 6px rgba(79, 70, 229, 0.1))"
    />

    {/* ฟอร์มข้อมูล */}
    <rect x="120" y="90" width="160" height="20" rx="4" fill="#e0e7ff" />
    <rect x="120" y="125" width="160" height="20" rx="4" fill="#e0e7ff" />
    <rect x="120" y="160" width="160" height="50" rx="4" fill="#e0e7ff" />

    {/* ไอคอนสเตตัส */}
    <circle cx="350" cy="50" r="30" fill="#4f46e5" />
    <path
      d="M340 50 L350 60 L370 40"
      stroke="#ffffff"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* ขั้นตอนกระบวนการ */}
    <path
      d="M50 250 L350 250"
      stroke="#4f46e5"
      strokeWidth="2"
      strokeDasharray="6 6"
    />
    <circle cx="50" cy="250" r="10" fill="#4f46e5" />
    <circle cx="200" cy="250" r="10" fill="#4f46e5" />
    <circle cx="350" cy="250" r="10" fill="#4f46e5" />

    {/* ตัวเลขขั้นตอน */}
    <text
      x="50"
      y="254"
      textAnchor="middle"
      fill="white"
      fontSize="12"
      fontWeight="bold"
    >
      1
    </text>
    <text
      x="200"
      y="254"
      textAnchor="middle"
      fill="white"
      fontSize="12"
      fontWeight="bold"
    >
      2
    </text>
    <text
      x="350"
      y="254"
      textAnchor="middle"
      fill="white"
      fontSize="12"
      fontWeight="bold"
    >
      3
    </text>
  </svg>
);

export const VerifyProductImage = ({ className = "w-full h-full" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 400 300"
    className={className}
  >
    {/* พื้นหลัง */}
    <rect width="400" height="300" fill="#f3f4f6" />

    {/* กรอบหลัก */}
    <rect
      x="60"
      y="50"
      width="280"
      height="180"
      rx="12"
      fill="#ffffff"
      stroke="#4f46e5"
      strokeWidth="2"
      filter="drop-shadow(0px 4px 6px rgba(79, 70, 229, 0.1))"
    />

    {/* รูปสินค้า */}
    <rect x="80" y="80" width="100" height="120" rx="8" fill="#e0e7ff" />

    {/* รายละเอียดสินค้า */}
    <path
      d="M200 90 L330 90"
      stroke="#e0e7ff"
      strokeWidth="10"
      strokeLinecap="round"
    />
    <path
      d="M200 120 L330 120"
      stroke="#e0e7ff"
      strokeWidth="10"
      strokeLinecap="round"
    />
    <path
      d="M200 150 L280 150"
      stroke="#e0e7ff"
      strokeWidth="10"
      strokeLinecap="round"
    />

    {/* ปุ่มยืนยัน */}
    <rect x="200" y="170" width="80" height="30" rx="15" fill="#4f46e5" />
    <text
      x="240"
      y="190"
      textAnchor="middle"
      fill="white"
      fontSize="14"
      fontWeight="bold"
    ></text>

    {/* ไอคอนสถานะ */}
    <circle cx="350" cy="50" r="30" fill="#4f46e5" />
    <path
      d="M340 50 L350 60 L370 40"
      stroke="#ffffff"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* QR Code จำลอง */}
    <rect
      x="175"
      y="240"
      width="50"
      height="50"
      rx="8"
      fill="#ffffff"
      stroke="#4f46e5"
      strokeWidth="2"
    />
    <rect x="185" y="250" width="30" height="30" rx="4" fill="#e0e7ff" />
    <path
      d="M185 260 H215 M185 270 H215 M185 280 H215"
      stroke="#4f46e5"
      strokeWidth="1.5"
    />
  </svg>
);

export const TransferProductImage = ({ className = "w-full h-full" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 400 300"
    className={className}
  >
    {/* พื้นหลัง */}
    <rect width="400" height="300" fill="#f3f4f6" />

    {/* วงกลมผู้ส่ง */}
    <circle
      cx="100"
      cy="150"
      r="50"
      fill="#e0e7ff"
      stroke="#4f46e5"
      strokeWidth="2"
    />

    {/* วงกลมผู้รับ */}
    <circle
      cx="300"
      cy="150"
      r="50"
      fill="#e0e7ff"
      stroke="#4f46e5"
      strokeWidth="2"
    />

    {/* เส้นเชื่อมโยง */}
    <path
      d="M150 150 L250 150"
      stroke="#4f46e5"
      strokeWidth="3"
      strokeDasharray="6 6"
    />

    {/* ลูกศร */}
    <path
      d="M230 135 L250 150 L230 165"
      stroke="#4f46e5"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* สัญลักษณ์สินค้าผู้ส่ง */}
    <rect
      x="75"
      y="130"
      width="50"
      height="40"
      rx="5"
      fill="#ffffff"
      stroke="#4f46e5"
      strokeWidth="2"
    />

    {/* สัญลักษณ์สินค้าผู้รับ */}
    <rect
      x="275"
      y="130"
      width="50"
      height="40"
      rx="5"
      fill="#ffffff"
      stroke="#4f46e5"
      strokeWidth="2"
    />

    {/* ไอคอนผู้ส่ง */}
    <circle
      cx="100"
      cy="190"
      r="15"
      fill="#ffffff"
      stroke="#4f46e5"
      strokeWidth="2"
    />
    <path
      d="M95 190 L105 190 M100 185 L100 195"
      stroke="#4f46e5"
      strokeWidth="2"
    />

    {/* ไอคอนผู้รับ */}
    <circle
      cx="300"
      cy="190"
      r="15"
      fill="#ffffff"
      stroke="#4f46e5"
      strokeWidth="2"
    />
    <path d="M295 190 L305 190" stroke="#4f46e5" strokeWidth="2" />

    {/* แถบแสดงราคา */}
    <path
      d="M200 80 L200 220"
      stroke="#4f46e5"
      strokeWidth="2"
      strokeDasharray="6 6"
    />

    {/* สัญลักษณ์ราคา */}
    <circle cx="200" cy="70" r="20" fill="#4f46e5" />
    <text
      x="200"
      y="75"
      textAnchor="middle"
      fill="white"
      fontSize="14"
      fontWeight="bold"
    >
      ฿
    </text>

    {/* สัญญาสำเร็จ */}
    <circle cx="200" cy="230" r="20" fill="#4f46e5" />
    <path
      d="M190 230 L197 237 L210 223"
      stroke="#ffffff"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ProductPlaceholderImage = ({
  className = "w-full h-full object-cover",
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 400 300"
    className={className}
  >
    {/* พื้นหลัง */}
    <rect width="400" height="300" fill="#e5e7eb" />

    {/* พื้นหลังสินค้า */}
    <rect x="100" y="50" width="200" height="200" rx="12" fill="#d1d5db" />

    {/* รูปภาพสินค้า */}
    <rect x="120" y="70" width="160" height="120" rx="8" fill="#9ca3af" />

    {/* ไอคอนรูปภาพ */}
    <circle cx="200" cy="130" r="25" fill="#6b7280" />
    <path
      d="M190 130 A10 10 0 1 0 190 129.9"
      stroke="#f3f4f6"
      strokeWidth="3"
      fill="none"
    />

    {/* ชื่อสินค้า */}
    <rect x="130" y="210" width="140" height="12" rx="6" fill="#9ca3af" />

    {/* ราคา */}
    <rect x="150" y="230" width="100" height="10" rx="5" fill="#9ca3af" />

    {/* Blockchain status */}
    <circle cx="340" cy="60" r="15" fill="#4f46e5" opacity="0.8" />
    <path
      d="M330 60 L340 70 L350 50"
      stroke="#ffffff"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// สร้างคอมโพเนนต์ที่รองรับ className และสามารถปรับแต่งได้ในอนาคต
const PlaceholderImages = {
  RegisterProductImage,
  VerifyProductImage,
  TransferProductImage,
  ProductPlaceholderImage,
};

export default PlaceholderImages;
