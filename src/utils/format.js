// src/utils/format.js

/**
 * ฟังก์ชันสำหรับแสดงที่อยู่กระเป๋าเงินแบบย่อ
 * @param {string} address ที่อยู่กระเป๋าเงิน
 * @param {number} startLength จำนวนตัวอักษรที่แสดงด้านหน้า (default: 6)
 * @param {number} endLength จำนวนตัวอักษรที่แสดงด้านหลัง (default: 4)
 * @returns {string} ที่อยู่กระเป๋าเงินแบบย่อ
 */
export function formatAddress(address, startLength = 6, endLength = 4) {
  if (!address) return "";
  if (address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * ฟังก์ชันสำหรับแสดงวันที่ในรูปแบบไทย
 * @param {number|string|Date} timestamp เวลาในรูปแบบ timestamp หรือวัตถุ Date
 * @returns {string} วันที่ในรูปแบบไทย (วันที่ เดือน ปี เวลา)
 */
export function formatDate(timestamp) {
  try {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

    // ถ้าวันที่ไม่ถูกต้อง
    if (isNaN(date.getTime())) {
      return "วันที่ไม่ถูกต้อง";
    }

    // แสดงวันที่ในรูปแบบไทย
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "วันที่ไม่ถูกต้อง";
  }
}

/**
 * ฟังก์ชันสำหรับแสดงตัวเลขในรูปแบบเงิน
 * @param {number|string} amount จำนวนเงิน
 * @param {string} currency สกุลเงิน (default: 'THB')
 * @returns {string} จำนวนเงินในรูปแบบที่อ่านง่าย
 */
export function formatCurrency(amount, currency = "THB") {
  if (amount === undefined || amount === null) return "";

  try {
    const numericAmount =
      typeof amount === "string" ? parseFloat(amount) : amount;

    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch (error) {
    console.error("Error formatting currency:", error);
    return `${amount} ${currency}`;
  }
}

/**
 * ฟังก์ชันคำนวณเวลาที่ผ่านมาจนถึงปัจจุบัน
 * @param {number|string|Date} timestamp เวลาในรูปแบบ timestamp หรือวัตถุ Date
 * @returns {string} ข้อความแสดงเวลาที่ผ่านมา เช่น "5 นาทีที่แล้ว", "2 ชั่วโมงที่แล้ว"
 */
export function formatTimeAgo(timestamp) {
  try {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const secondsAgo = Math.floor((now - date) / 1000);

    // ถ้าเวลาไม่ถูกต้อง
    if (isNaN(date.getTime())) {
      return "ไม่ทราบเวลา";
    }

    // ถ้าเป็นเวลาในอนาคต
    if (secondsAgo < 0) {
      return formatDate(date);
    }

    // ถ้าน้อยกว่า 1 นาที
    if (secondsAgo < 60) {
      return "เมื่อสักครู่";
    }

    // ถ้าน้อยกว่า 1 ชั่วโมง
    if (secondsAgo < 3600) {
      const minutes = Math.floor(secondsAgo / 60);
      return `${minutes} นาทีที่แล้ว`;
    }

    // ถ้าน้อยกว่า 1 วัน
    if (secondsAgo < 86400) {
      const hours = Math.floor(secondsAgo / 3600);
      return `${hours} ชั่วโมงที่แล้ว`;
    }

    // ถ้าน้อยกว่า 30 วัน
    if (secondsAgo < 2592000) {
      const days = Math.floor(secondsAgo / 86400);
      return `${days} วันที่แล้ว`;
    }

    // ถ้าน้อยกว่า 12 เดือน
    if (secondsAgo < 31536000) {
      const months = Math.floor(secondsAgo / 2592000);
      return `${months} เดือนที่แล้ว`;
    }

    // ถ้ามากกว่า 12 เดือน
    const years = Math.floor(secondsAgo / 31536000);
    return `${years} ปีที่แล้ว`;
  } catch (error) {
    console.error("Error formatting time ago:", error);
    return "ไม่ทราบเวลา";
  }
}
