import { ethers } from "ethers";
import {
  VERIFACT_ABI,
  VERIFACT_CONTRACT_ADDRESS,
} from "@/lib/web3/contracts/VeriFactABI";

// สร้าง provider แบบ read-only สำหรับการอ่านข้อมูลจาก blockchain
// ถ้าใช้ production ให้เปลี่ยนเป็น URL ของ RPC provider จริง
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545"; // ปรับให้เข้ากับเครือข่ายที่ใช้
const provider = new ethers.JsonRpcProvider(RPC_URL);

// สร้าง contract instance แบบ read-only
const verifactContract = new ethers.Contract(
  VERIFACT_CONTRACT_ADDRESS,
  VERIFACT_ABI,
  provider
);

export async function GET(request) {
  try {
    // รับพารามิเตอร์จาก URL
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("id");

    if (!productId) {
      return Response.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าเป็นหมายเลขซีเรียลหรือไม่
    const isSerialNumber =
      productId.includes("SN-") ||
      /^[A-Z]{2}-\d{4}-\d{4}-\d{4}$/.test(productId);

    let actualProductId = productId;

    // ถ้าเป็นหมายเลขซีเรียล ให้ค้นหา productId ก่อน
    if (isSerialNumber) {
      try {
        actualProductId = await findProductBySerialNumber(productId);
        if (!actualProductId) {
          return Response.json(
            {
              exists: false,
              message: "Product not found with this serial number",
            },
            { status: 404 }
          );
        }
      } catch (error) {
        console.error("Error finding product by serial number:", error);
        return Response.json(
          { error: "Failed to find product by serial number" },
          { status: 500 }
        );
      }
    }

    // ตรวจสอบว่ามีสินค้านี้หรือไม่
    try {
      const verifyResult = await verifactContract.verifyProduct(
        actualProductId
      );

      if (!verifyResult[0]) {
        // ตัวแรกคือ exists
        return Response.json(
          { exists: false, message: "Product not found" },
          { status: 404 }
        );
      }

      // ดึงข้อมูลสินค้า
      const productData = await verifactContract.getProduct(actualProductId);

      // แปลงข้อมูลให้เป็นรูปแบบที่เข้าใจง่าย
      const formattedProduct = {
        productId: productData[0] || actualProductId,
        details: productData[1] || "ไม่มีรายละเอียด",
        initialPrice: productData[2]?.toString() || "0",
        currentOwner: productData[3] || "ไม่ระบุเจ้าของ",
        createdAt: productData[4]?.toString() || "0",
        isActive: productData[5] || false,
        designatedSuccessor: productData[6] || null,
      };

      // ดึงประวัติการโอน
      const transferHistory = await verifactContract.getTransferHistory(
        actualProductId
      );

      // แปลงประวัติการโอนให้อยู่ในรูปแบบที่เข้าใจง่าย
      const formattedHistory = transferHistory.map((history) => ({
        from: history[0],
        to: history[1],
        price: history[2]?.toString(),
        timestamp: history[3]?.toString(),
      }));

      return Response.json({
        exists: true,
        product: formattedProduct,
        transferHistory: formattedHistory,
      });
    } catch (error) {
      console.error("Error verifying product:", error);
      return Response.json(
        { error: "Failed to verify product" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ฟังก์ชันค้นหาสินค้าด้วยหมายเลขซีเรียล
async function findProductBySerialNumber(serialNumber) {
  try {
    // ดึงรายการสินค้าทั้งหมด
    const allProductIds = await verifactContract.getAllProductIds();

    // วนลูปเพื่อค้นหาสินค้าที่มีหมายเลขซีเรียลตรงกัน
    for (const productId of allProductIds) {
      const product = await verifactContract.getProduct(productId);
      if (product && product[1]) {
        // product[1] คือ details
        const details = product[1];
        // ตรวจสอบว่า details มีหมายเลขซีเรียลหรือไม่
        if (details.includes(serialNumber)) {
          return productId;
        }
      }
    }

    return null; // ไม่พบสินค้า
  } catch (error) {
    console.error("Error in findProductBySerialNumber:", error);
    throw error;
  }
}
