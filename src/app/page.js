// src/app/page.js
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useWeb3 } from "@/contexts/Web3Context";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  RegisterProductImage,
  VerifyProductImage,
  TransferProductImage,
} from "../components/ui/PlaceholderImages";

export default function HomePage() {
  const router = useRouter();
  const {
    account,
    isAdmin,
    getAllProductIds,
    getProductDetails,
    connectWallet,
  } = useWeb3();
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecentProducts = async () => {
      try {
        if (!getAllProductIds) return;

        setLoading(true);

        // ดึงรายการรหัสสินค้าทั้งหมด
        const productIds = await getAllProductIds();

        // ถ้ามีสินค้าน้อยกว่า 5 ชิ้น ดึงมาทั้งหมด ถ้ามีมากกว่าดึงมาเพียง 5 ชิ้นล่าสุด
        const recentIds = productIds.slice(-5).reverse();

        // ดึงรายละเอียดสินค้าจากรหัสสินค้า
        const products = await Promise.all(
          recentIds.map(async (id) => {
            return await getProductDetails(id);
          })
        );

        setRecentProducts(products);
      } catch (err) {
        console.error("Error loading recent products:", err);
      } finally {
        setLoading(false);
      }
    };

    // เพิ่มการตรวจสอบสิทธิ์ admin
    const checkAdminAndRedirect = () => {
      if (isAdmin) {
        router.push("/seller/dashboard");
      }
    };

    loadRecentProducts();
    checkAdminAndRedirect();
  }, [getAllProductIds, getProductDetails, isAdmin, router]);

  // ฟังก์ชันสำหรับแปลงเวลาให้อยู่ในรูปแบบที่อ่านง่าย
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ฟังก์ชันสำหรับย่อที่อยู่ Ethereum ให้อ่านง่ายขึ้น
  const shortenAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  return (
    <>
      {/* Hero Section - ปรับปรุงใหม่ด้วย gradient และภาพประกอบ */}
      <section className="relative min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
        {/* เพิ่มองค์ประกอบตกแต่ง */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full">
            {/* Grid background เพิ่มความละเอียด */}
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]"></div>

            {/* รูปแบบวงกลมเรืองแสง - ปรับปรุงจากเดิม */}
            <div className="absolute -left-20 md:left-1/4 top-1/4 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl animate-pulse-slow"></div>
            <div className="absolute right-1/3 -bottom-10 md:bottom-1/4 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl animate-pulse-medium"></div>
            <div className="absolute -right-20 md:right-1/4 top-1/3 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl animate-pulse-slow"></div>

            {/* เพิ่มวงกลมเส้นประ */}
            <div className="absolute top-20 right-20 w-40 h-40 rounded-full border border-dashed border-white/10 animate-spin-very-slow"></div>
            <div className="absolute bottom-20 left-20 w-60 h-60 rounded-full border border-dashed border-white/10 animate-spin-very-slow-reverse"></div>

            {/* เพิ่มองค์ประกอบลายเส้นนามธรรม */}
            <svg
              className="absolute bottom-0 left-0 w-full h-1/3 opacity-20"
              viewBox="0 0 1200 300"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0,192L48,197.3C96,203,192,213,288,218.7C384,224,480,224,576,202.7C672,181,768,139,864,144C960,149,1056,203,1152,208C1248,213,1344,171,1392,149.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                fill="currentColor"
                fillOpacity="0.1"
              ></path>
            </svg>

            {/* ไฟพริบแบบดาว */}
            <div className="absolute top-24 right-1/4 w-1 h-1 bg-white rounded-full animate-twinkle"></div>
            <div className="absolute top-40 left-1/3 w-2 h-2 bg-white rounded-full animate-twinkle-delay"></div>
            <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-white rounded-full animate-twinkle-delay-2"></div>
            <div className="absolute top-1/2 left-20 w-1 h-1 bg-white rounded-full animate-twinkle"></div>
            <div className="absolute bottom-40 right-24 w-2 h-2 bg-white rounded-full animate-twinkle-delay-3"></div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 flex flex-col items-center justify-center">
          <div className="text-center max-w-3xl mx-auto">
            {/* ประยุกต์ใช้ฟอนต์แบบกำหนดเอง */}
            <h1 className="hero-title text-4xl md:text-6xl mb-6">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-300">
                VeriFact
              </span>
              <span className="hero-subtitle block text-3xl md:text-4xl mt-3 font-medium">
                ระบบตรวจสอบสินค้าของแท้บนบล็อกเชน
              </span>
            </h1>
            <p className="font-sarabun text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
              ยืนยันความถูกต้อง ติดตามประวัติ
              และส่งต่อสินค้ามีค่าของคุณอย่างปลอดภัยด้วยเทคโนโลยี Blockchain
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/verify" legacyBehavior>
                <a className="button-text bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-8 rounded-xl text-lg font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  ตรวจสอบสินค้า
                </a>
              </Link>

              {/* เพิ่มปุ่มเชื่อมต่อกระเป๋าเงิน */}
              {!account ? (
                <button
                  onClick={connectWallet}
                  className="button-text bg-white/10 backdrop-blur hover:bg-white/20 text-white py-4 px-8 rounded-xl text-lg font-medium border border-white/30 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <span className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M19 7H5C3.89543 7 3 7.89543 3 9V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V9C21 7.89543 20.1046 7 19 7Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M16 20V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V20"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    เชื่อมต่อกระเป๋าเงิน
                  </span>
                </button>
              ) : (
                <Link href="/dashboard" legacyBehavior>
                  <a className="button-text bg-white/10 backdrop-blur hover:bg-white/20 text-white py-4 px-8 rounded-xl text-lg font-medium border border-white/30 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                    <span className="flex items-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10 3H3V10H10V3Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M21 3H14V10H21V3Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M21 14H14V21H21V14Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10 14H3V21H10V14Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      แดชบอร์ดของฉัน
                    </span>
                  </a>
                </Link>
              )}
            </div>

            {/* Floating cards animation */}
            <div className="mt-24 hidden lg:block relative h-60">
              <div className="absolute left-0 top-0 w-64 h-40 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur rounded-xl shadow-2xl border border-white/10 transform -rotate-12 animate-float-slow">
                <div className="p-4">
                  <div className="w-8 h-8 rounded-full bg-green-400/30 backdrop-blur mb-2"></div>
                  <div className="h-2 w-3/4 bg-white/20 rounded-full mb-2"></div>
                  <div className="h-2 w-1/2 bg-white/20 rounded-full"></div>
                </div>
              </div>
              <div className="absolute right-0 top-10 w-64 h-40 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur rounded-xl shadow-2xl border border-white/10 transform rotate-6 animate-float-medium">
                <div className="p-4">
                  <div className="w-8 h-8 rounded-full bg-blue-400/30 backdrop-blur mb-2"></div>
                  <div className="h-2 w-3/4 bg-white/20 rounded-full mb-2"></div>
                  <div className="h-2 w-1/2 bg-white/20 rounded-full"></div>
                </div>
              </div>
              <div className="absolute left-1/3 top-20 w-64 h-40 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur rounded-xl shadow-2xl border border-white/10 transform rotate-12 animate-float">
                <div className="p-4">
                  <div className="w-8 h-8 rounded-full bg-purple-400/30 backdrop-blur mb-2"></div>
                  <div className="h-2 w-3/4 bg-white/20 rounded-full mb-2"></div>
                  <div className="h-2 w-1/2 bg-white/20 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-blue-200 animate-bounce">
              <span className="text-sm mb-1 font-ibm">
                เลื่อนลงเพื่อดูเพิ่มเติม
              </span>
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - ปรับปรุงใหม่ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ทำไมต้องใช้ VeriFact?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              ระบบของเราใช้เทคโนโลยี Blockchain ที่โปร่งใส ไม่สามารถแก้ไขได้
              และตรวจสอบได้ตลอดเวลา เพื่อสร้างความมั่นใจในความถูกต้องของสินค้า
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="bg-blue-50 rounded-2xl p-8 shadow-md transform transition duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                ตรวจสอบความถูกต้อง
              </h3>
              <p className="text-gray-700 leading-relaxed">
                ยืนยันความถูกต้องของสินค้าด้วยการสแกนหรือกรอกรหัสสินค้า
                ตรวจสอบประวัติและผู้ถือครองปัจจุบันได้ทันที ไม่มีการปลอมแปลง
              </p>
            </div>

            <div className="bg-indigo-50 rounded-2xl p-8 shadow-md transform transition duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                โอนสินค้าอย่างปลอดภัย
              </h3>
              <p className="text-gray-700 leading-relaxed">
                โอนกรรมสิทธิ์สินค้าไปยังเจ้าของใหม่อย่างปลอดภัยด้วย Smart
                Contract บนเครือข่าย Blockchain ไม่ต้องกังวลเรื่องตัวกลาง
              </p>
            </div>

            <div className="bg-purple-50 rounded-2xl p-8 shadow-md transform transition duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-2xl flex items-center justify-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                ประวัติการถือครอง
              </h3>
              <p className="text-gray-700 leading-relaxed">
                ติดตามประวัติการถือครองทั้งหมดของสินค้า
                จากผู้ผลิตจนถึงผู้ถือครองปัจจุบัน
                พร้อมข้อมูลราคาและเวลาที่แน่นอน
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - ปรับปรุงใหม่ */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              วิธีการทำงาน
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              ระบบ VeriFact ทำงานด้วยเทคโนโลยี Blockchain ที่ทันสมัย
              ช่วยให้การตรวจสอบและโอนกรรมสิทธิ์สินค้าเป็นไปอย่างโปร่งใสและปลอดภัย
            </p>
          </div>

          <div className="relative">
            {/* เส้นเชื่อม Step ในแนวตั้ง (สำหรับหน้าจอขนาดใหญ่) */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-blue-200 transform -translate-x-1/2"></div>

            {/* ขั้นตอนที่ 1 */}
            <div className="relative mb-16">
              <div className="md:grid md:grid-cols-5 items-center">
                <div className="md:col-span-2 mb-8 md:mb-0 md:pr-12 text-center md:text-right">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    ลงทะเบียนสินค้า
                  </h3>
                  <p className="text-gray-700">
                    ผู้ผลิตที่ได้รับอนุญาตลงทะเบียนสินค้าลงบนบล็อกเชน
                    พร้อมรายละเอียดและรหัสเฉพาะสำหรับการติดตาม
                  </p>
                </div>

                <div className="md:col-span-1 flex justify-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold z-10">
                    1
                  </div>
                </div>

                <div className="md:col-span-2 md:pl-12 text-center md:text-left">
                  <div className="bg-white p-6 rounded-2xl shadow-xl">
                    <RegisterProductImage />
                  </div>
                </div>
              </div>
            </div>

            {/* ขั้นตอนที่ 2 */}
            <div className="relative mb-16">
              <div className="md:grid md:grid-cols-5 items-center">
                <div className="md:col-span-2 mb-8 md:mb-0 md:pr-12 text-center md:text-right order-1 md:order-3">
                  <div className="bg-white p-6 rounded-2xl shadow-xl">
                    <VerifyProductImage />
                  </div>
                </div>

                <div className="md:col-span-1 flex justify-center order-2">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold z-10">
                    2
                  </div>
                </div>

                <div className="md:col-span-2 md:pl-12 text-center md:text-left order-3 md:order-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    ตรวจสอบความถูกต้อง
                  </h3>
                  <p className="text-gray-700">
                    ผู้ซื้อสามารถตรวจสอบความถูกต้องของสินค้าโดยการกรอกรหัสสินค้าหรือสแกน
                    QR Code เพื่อดูประวัติและยืนยันความเป็นเจ้าของ
                  </p>
                </div>
              </div>
            </div>

            {/* ขั้นตอนที่ 3 */}
            <div className="relative">
              <div className="md:grid md:grid-cols-5 items-center">
                <div className="md:col-span-2 mb-8 md:mb-0 md:pr-12 text-center md:text-right">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    โอนกรรมสิทธิ์
                  </h3>
                  <p className="text-gray-700">
                    เมื่อสินค้าถูกขายต่อ
                    เจ้าของปัจจุบันสามารถโอนกรรมสิทธิ์ไปยังผู้ซื้อใหม่ได้อย่างปลอดภัยผ่านทางระบบ
                  </p>
                </div>

                <div className="md:col-span-1 flex justify-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold z-10">
                    3
                  </div>
                </div>

                <div className="md:col-span-2 md:pl-12 text-center md:text-left">
                  <div className="bg-white p-6 rounded-2xl shadow-xl">
                    <TransferProductImage />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Products Section */}
      {recentProducts.length > 0 && (
        <section className="py-20 bg-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                สินค้าล่าสุดในระบบ
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                ตัวอย่างสินค้าที่ลงทะเบียนไว้ในระบบล่าสุด พร้อมให้คุณตรวจสอบ
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentProducts.map((product, index) => (
                <Link
                  href={`/verify?id=${product.productId}`}
                  key={product.productId}
                  legacyBehavior
                >
                  <a className="bg-white rounded-xl shadow-md overflow-hidden transform transition duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="h-48 bg-gray-200 flex items-center justify-center">
                      <Image
                        src={
                          product.imageURI || "/images/product-placeholder.jpg"
                        }
                        alt={product.productName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/images/product-placeholder.jpg";
                        }}
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {product.productName}
                        </h3>
                        {product.isAuthentic ? (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                            ของแท้
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                            ไม่ใช่ของแท้
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-3">
                        รหัส: {product.productId}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          เจ้าของ: {shortenAddress(product.currentOwner)}
                        </span>
                        <span className="text-gray-500">
                          {formatDate(product.registeredAt * 1000)}
                        </span>
                      </div>
                    </div>
                  </a>
                </Link>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link href="/marketplace" legacyBehavior>
                <a className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition duration-300">
                  ดูสินค้าทั้งหมดในตลาด
                  <svg
                    className="ml-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            เริ่มใช้งาน VeriFact วันนี้
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-10">
            ตรวจสอบความถูกต้อง โอนกรรมสิทธิ์
            และติดตามประวัติสินค้าได้อย่างง่ายดายด้วยเทคโนโลยี Blockchain
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/verify" legacyBehavior>
              <a className="bg-white text-blue-600 hover:bg-blue-50 py-3 sm:py-4 px-6 sm:px-8 rounded-xl text-base sm:text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                เริ่มตรวจสอบสินค้า
              </a>
            </Link>
            {account ? (
              <Link href="/dashboard" legacyBehavior>
                <a className="bg-blue-500/30 backdrop-blur hover:bg-blue-500/40 text-white border border-white/30 py-3 sm:py-4 px-6 sm:px-8 rounded-xl text-base sm:text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  จัดการสินค้าของฉัน
                </a>
              </Link>
            ) : (
              <Link href="/auth/login" legacyBehavior>
                <a className="bg-blue-500/30 backdrop-blur hover:bg-blue-500/40 text-white border border-white/30 py-3 sm:py-4 px-6 sm:px-8 rounded-xl text-base sm:text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  เข้าสู่ระบบ
                </a>
              </Link>
            )}
          </div>
        </div>
      </section>
      {/* Footer Section - เพิ่มใหม่ */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="rounded-full bg-blue-600 p-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-white">VeriFact</h1>
              </div>
              <p className="text-sm text-gray-400 mb-6">
                ระบบตรวจสอบและยืนยันความถูกต้องของสินค้าบนเทคโนโลยี Blockchain
                ที่โปร่งใสและปลอดภัย
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </a>
              </div>
            </div>

            <div className="col-span-1">
              <h3 className="text-lg font-semibold text-white mb-4">บริการ</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/verify"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ตรวจสอบสินค้า
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ลงทะเบียนสินค้า
                  </Link>
                </li>
                <li>
                  <Link
                    href="/transfer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    โอนกรรมสิทธิ์
                  </Link>
                </li>
                <li>
                  <Link
                    href="/marketplace"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ตลาดสินค้า
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-span-1">
              <h3 className="text-lg font-semibold text-white mb-4">ข้อมูล</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/about"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    เกี่ยวกับเรา
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    คำถามที่พบบ่อย
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    นโยบายความเป็นส่วนตัว
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    เงื่อนไขการใช้งาน
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-span-1">
              <h3 className="text-lg font-semibold text-white mb-4">
                ติดต่อเรา
              </h3>
              <div className="space-y-3">
                <p className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-gray-400">
                    กรุงเทพมหานคร, ประเทศไทย
                  </span>
                </p>
                <p className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-gray-400">contact@verifact.com</span>
                </p>
                <p className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span className="text-gray-400">02-123-4567</span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 text-center">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} VeriFact. สงวนลิขสิทธิ์ทั้งหมด.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
