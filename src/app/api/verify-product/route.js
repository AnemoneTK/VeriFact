// ปรับปรุง API route ในไฟล์ src/app/api/verify-product/route.js
import { NextResponse } from "next/server";
import * as ethers from "ethers";
import {
  VERIFACT_ABI,
  VERIFACT_CONTRACT_ADDRESS,
} from "@/lib/web3/contracts/VeriFactABI";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const idOrSerial = searchParams.get("id");

  console.log("API: Checking ID or Serial:", idOrSerial);

  if (!idOrSerial) {
    return NextResponse.json(
      { error: "Product ID or Serial number is required" },
      { status: 400 }
    );
  }

  try {
    // ใช้ RPC URL ที่ทำงานได้แล้ว
    const provider = new ethers.JsonRpcProvider(
      "https://rpc.ankr.com/eth_holesky"
    );

    // สร้าง Contract instance
    const contract = new ethers.Contract(
      VERIFACT_CONTRACT_ADDRESS,
      VERIFACT_ABI,
      provider
    );

    // ตรวจสอบว่าเป็น Serial number หรือไม่
    const isSerialNumber =
      idOrSerial.startsWith("SN-") ||
      /^[A-Z]{2}-\d{4}-\d{4}-\d{4}$/.test(idOrSerial);

    let productId = idOrSerial;

    // ถ้าเป็น Serial number ให้ค้นหา productId ก่อน
    if (isSerialNumber) {
      console.log("API: Input is a serial number, searching for product ID...");
      try {
        productId = await contract.findProductBySerialNumber(idOrSerial);
        console.log("API: Found productId for serial number:", productId);

        if (!productId || productId === "") {
          return NextResponse.json({
            exists: false,
            message: "ไม่พบสินค้าที่มีหมายเลขซีเรียลนี้",
          });
        }
      } catch (serialError) {
        console.error("Error finding product by serial:", serialError);
        return NextResponse.json({
          exists: false,
          error: "ไม่สามารถค้นหาสินค้าด้วยหมายเลขซีเรียลได้",
          details: serialError.message,
        });
      }
    }

    // ตรวจสอบว่ามีสินค้านี้หรือไม่
    console.log("API: Verifying product with ID:", productId);
    const verifyResult = await contract.verifyProduct(productId);

    if (!verifyResult[0]) {
      // check exists parameter
      return NextResponse.json({ exists: false });
    }

    // ดึงข้อมูลสินค้า
    const productData = await contract.getProduct(productId);
    const transferHistory = await contract.getTransferHistory(productId);

    // แปลงข้อมูลสินค้า
    const formattedProduct = {
      productId: productData[0] || productId,
      details: productData[1] || "ไม่มีรายละเอียด",
      initialPrice: productData[2]?.toString() || "0",
      currentOwner: productData[3] || "ไม่ระบุเจ้าของ",
      createdAt: productData[4]?.toString() || "0",
      isActive: productData[5] || false,
      designatedSuccessor: productData[6] || null,
      // เพิ่มข้อมูลว่าค้นหาด้วยอะไร
      searchedBy: isSerialNumber ? "serial" : "productId",
      serialNumber: isSerialNumber ? idOrSerial : null,
    };

    // แปลงประวัติการโอน
    const formattedHistory = transferHistory.map((item) => ({
      from: item[0] || "",
      to: item[1] || "",
      price: item[2]?.toString() || "0",
      timestamp: item[3]?.toString() || "0",
    }));

    return NextResponse.json({
      exists: true,
      product: formattedProduct,
      transferHistory: formattedHistory,
    });
  } catch (error) {
    console.error("API: General error:", error);
    return NextResponse.json(
      {
        error: "Failed to verify product",
        message: error.message,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
