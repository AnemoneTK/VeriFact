// // src/app/successor/set/page.js
// "use client";

// import { useState, useEffect } from "react";
// import { useSearchParams, useRouter } from "next/navigation";
// import Link from "next/link";
// import { useWeb3 } from "@/contexts/Web3Context";
// import { useAuth } from "@/contexts/AuthContext";
// import { useToast } from "@/contexts/ToastContext";

// export default function SetSuccessorPage() {
//   const [productDetails, setProductDetails] = useState(null);
//   const [currentSuccessor, setCurrentSuccessor] = useState(null);
//   const [successorAddress, setSuccessorAddress] = useState("");
//   const [isLoading, setIsLoading] = useState(true);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [error, setError] = useState("");

//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const productId = searchParams.get("productId");

//   const { verifactContract, account, isConnected, connectWallet } = useWeb3();
//   const { user } = useAuth();
//   const { showSuccess, showError } = useToast();

//   // ตรวจสอบว่ามีการระบุรหัสสินค้าหรือไม่
//   useEffect(() => {
//     if (!productId) {
//       setError("ไม่พบรหัสสินค้า กรุณาระบุรหัสสินค้าที่ต้องการตั้งผู้รับสืบทอด");
//       setIsLoading(false);
//     }
//   }, [productId]);

//   // ดึงข้อมูลสินค้าและตรวจสอบสิทธิ์
//   useEffect(() => {
//     const fetchProductDetails = async () => {
//       if (!productId || !isConnected || !verifactContract || !account) {
//         setIsLoading(false);
//         return;
//       }

//       try {
//         // ดึงข้อมูลสินค้า
//         const product = await verifactContract.methods
//           .getProduct(productId)
//           .call();

//         // ตรวจสอบว่าผู้ใช้ปัจจุบันเป็นเจ้าของสินค้าหรือไม่
//         if (product.currentOwner.toLowerCase() !== account.toLowerCase()) {
//           setError("คุณไม่ใช่เจ้าของสินค้านี้ ไม่สามารถตั้งผู้รับสืบทอดได้");
//           setIsLoading(false);
//           return;
//         }

//         // ตั้งค่าข้อมูลสินค้าและผู้รับสืบทอดปัจจุบัน (ถ้ามี)
//         setProductDetails(product);
//         setCurrentSuccessor(product.designatedSuccessor);
//         setIsLoading(false);
//       } catch (err) {
//         console.error("Error fetching product details:", err);
//         setError("ไม่สามารถดึงข้อมูลสินค้าได้ โปรดลองอีกครั้ง");
//         setIsLoading(false);
//       }
//     };

//     fetchProductDetails();
//   }, [productId, verifactContract, isConnected, account]);

//   // ฟังก์ชันตั้งผู้รับสืบทอด
//   const handleSetSuccessor = async (e) => {
//     e.preventDefault();

//     if (!successorAddress) {
//       showError("กรุณากรอกที่อยู่กระเป๋าเงินผู้รับสืบทอด");
//       return;
//     }

//     if (!/^0x[a-fA-F0-9]{40}$/.test(successorAddress)) {
//       showError("รูปแบบที่อยู่กระเป๋าเงินไม่ถูกต้อง");
//       return;
//     }

//     if (successorAddress.toLowerCase() === account.toLowerCase()) {
//       showError("คุณไม่สามารถตั้งตัวเองเป็นผู้รับสืบทอด");
//       return;
//     }

//     setIsProcessing(true);

//     try {
//       await verifactContract.methods
//         .setSuccessor(productId, successorAddress)
//         .send({ from: account });

//       showSuccess("ตั้งค่าผู้รับสืบทอดสำเร็จ");

//       // อัปเดตผู้รับสืบทอดปัจจุบัน
//       setCurrentSuccessor(successorAddress);
//       setSuccessorAddress("");

//       // รีเฟรชหน้าเพื่อดึงข้อมูลใหม่
//       setTimeout(() => {
//         router.refresh();
//       }, 2000);
//     } catch (err) {
//       console.error("Error setting successor:", err);
//       showError(
//         "เกิดข้อผิดพลาดในการตั้งผู้รับสืบทอด: " +
//           (err.message || "โปรดลองอีกครั้ง")
//       );
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   // ฟังก์ชันยกเลิกผู้รับสืบทอด
//   const handleRemoveSuccessor = async () => {
//     if (!currentSuccessor) return;

//     setIsProcessing(true);

//     try {
//       await verifactContract.methods
//         .removeSuccessor(productId)
//         .send({ from: account });

//       showSuccess("ยกเลิกผู้รับสืบทอดสำเร็จ");
//       setCurrentSuccessor(null);

//       // รีเฟรชหน้าเพื่อดึงข้อมูลใหม่
//       setTimeout(() => {
//         router.refresh();
//       }, 2000);
//     } catch (err) {
//       console.error("Error removing successor:", err);
//       showError(
//         "เกิดข้อผิดพลาดในการยกเลิกผู้รับสืบทอด: " +
//           (err.message || "โปรดลองอีกครั้ง")
//       );
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   // ฟังก์ชันย่อที่อยู่กระเป๋าเงิน
//   const truncateAddress = (address, startLength = 6, endLength = 4) => {
//     if (!address) return "";
//     return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
//   };

//   if (!user) {
//     return (
//       <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
//         <div className="max-w-md mx-auto">
//           <div className="bg-white rounded-xl shadow-md p-8">
//             <div className="text-center">
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-16 w-16 text-red-500 mx-auto"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
//                 />
//               </svg>
//               <h2 className="mt-4 text-xl font-semibold text-gray-900">
//                 กรุณาเข้าสู่ระบบ
//               </h2>
//               <p className="mt-2 text-gray-600">
//                 คุณต้องเข้าสู่ระบบเพื่อตั้งผู้รับสืบทอด
//               </p>
//               <div className="mt-6">
//                 <Link
//                   href="/auth/login"
//                   className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
//                 >
//                   เข้าสู่ระบบ
//                 </Link>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!isConnected) {
//     return (
//       <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
//         <div className="max-w-md mx-auto">
//           <div className="bg-white rounded-xl shadow-md p-8">
//             <div className="text-center">
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-16 w-16 text-yellow-500 mx-auto"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M13 10V3L4 14h7v7l9-11h-7z"
//                 />
//               </svg>
//               <h2 className="mt-4 text-xl font-semibold text-gray-900">
//                 เชื่อมต่อกระเป๋าเงิน
//               </h2>
//               <p className="mt-2 text-gray-600">
//                 กรุณาเชื่อมต่อกระเป๋าเงินของคุณเพื่อตั้งผู้รับสืบทอด
//               </p>
//               <div className="mt-6">
//                 <button
//                   onClick={connectWallet}
//                   className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
//                 >
//                   เชื่อมต่อกระเป๋าเงิน
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <main className="min-h-screen bg-gray-50">
//       {/* ส่วนหัว */}
//       <header className="bg-white shadow-md">
//         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center py-4">
//             <div className="flex items-center space-x-3">
//               <Link href="/" className="flex items-center space-x-3">
//                 <div className="rounded-full bg-blue-600 p-2">
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     className="h-6 w-6 text-white"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     stroke="currentColor"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
//                     />
//                   </svg>
//                 </div>
//                 <h1 className="text-xl font-bold text-gray-900">VeriFact</h1>
//               </Link>
//             </div>

//             <Link
//               href="/dashboard"
//               className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
//             >
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-4 w-4 mr-1.5"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
//                 />
//               </svg>
//               แดชบอร์ด
//             </Link>
//           </div>
//         </div>
//       </header>

//       {/* เนื้อหาหลัก */}
//       <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <div className="mb-8">
//           <button
//             onClick={() => router.back()}
//             className="inline-flex items-center text-blue-600 hover:text-blue-800"
//           >
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               className="h-5 w-5 mr-2"
//               viewBox="0 0 20 20"
//               fill="currentColor"
//             >
//               <path
//                 fillRule="evenodd"
//                 d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
//                 clipRule="evenodd"
//               />
//             </svg>
//             กลับไปหน้าก่อนหน้า
//           </button>
//         </div>

//         <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
//           <h1 className="text-2xl font-bold text-gray-900 mb-6">
//             ตั้งค่าผู้รับสืบทอด
//           </h1>

//           {error && (
//             <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
//               <div className="flex">
//                 <div className="flex-shrink-0">
//                   <svg
//                     className="h-5 w-5 text-red-400"
//                     xmlns="http://www.w3.org/2000/svg"
//                     viewBox="0 0 20 20"
//                     fill="currentColor"
//                   >
//                     <path
//                       fillRule="evenodd"
//                       d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
//                       clipRule="evenodd"
//                     />
//                   </svg>
//                 </div>
//                 <div className="ml-3">
//                   <p className="text-sm text-red-700">{error}</p>
//                 </div>
//               </div>
//             </div>
//           )}

//           {isLoading ? (
//             <div className="flex justify-center py-10">
//               <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
//             </div>
//           ) : (
//             <>
//               {productDetails && (
//                 <div className="mb-8">
//                   <h2 className="text-lg font-medium text-gray-900 mb-4">
//                     ข้อมูลสินค้า
//                   </h2>
//                   <div className="bg-gray-50 rounded-lg p-4">
//                     <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <div>
//                         <dt className="text-sm font-medium text-gray-500">
//                           รหัสสินค้า
//                         </dt>
//                         <dd className="mt-1 text-sm text-gray-900">
//                           {productDetails.productId}
//                         </dd>
//                       </div>
//                       <div>
//                         <dt className="text-sm font-medium text-gray-500">
//                           รายละเอียด
//                         </dt>
//                         <dd className="mt-1 text-sm text-gray-900">
//                           {productDetails.details?.split("|")[0] || "ไม่ระบุ"}
//                         </dd>
//                       </div>
//                       <div>
//                         <dt className="text-sm font-medium text-gray-500">
//                           เจ้าของปัจจุบัน
//                         </dt>
//                         <dd className="mt-1 text-sm text-gray-900">
//                           {truncateAddress(productDetails.currentOwner)} (คุณ)
//                         </dd>
//                       </div>
//                       {currentSuccessor && (
//                         <div>
//                           <dt className="text-sm font-medium text-gray-500">
//                             ผู้รับสืบทอดปัจจุบัน
//                           </dt>
//                           <dd className="mt-1 text-sm text-gray-900">
//                             {truncateAddress(currentSuccessor)}
//                           </dd>
//                         </div>
//                       )}
//                     </dl>
//                   </div>
//                 </div>
//               )}

//               <div className="p-6 border border-blue-200 rounded-lg bg-blue-50 mb-8">
//                 <h3 className="text-lg font-medium text-gray-900 mb-2">
//                   ผู้รับสืบทอดคืออะไร?
//                 </h3>
//                 <p className="text-gray-600 mb-4">
//                   ผู้รับสืบทอดคือบุคคลที่คุณกำหนดให้มีสิทธิ์รับโอนสินค้าของคุณในกรณีพิเศษ
//                   เช่น กรณีที่คุณไม่สามารถเข้าถึงกระเป๋าเงินได้
//                   หรือในสถานการณ์ฉุกเฉิน
//                 </p>
//                 <p className="text-gray-600 mb-4">
//                   เมื่อคุณตั้งผู้รับสืบทอดแล้ว
//                   บุคคลนั้นสามารถส่งคำขอเพื่อรับโอนสินค้า
//                   และคุณจะต้องยืนยันคำขอก่อนการโอนจะเกิดขึ้น
//                 </p>
//                 {!currentSuccessor && (
//                   <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
//                     <p className="text-sm text-yellow-700">
//                       คุณยังไม่ได้ตั้งผู้รับสืบทอดสำหรับสินค้านี้
//                     </p>
//                   </div>
//                 )}
//               </div>

//               <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
//                 <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
//                   <h3 className="text-lg font-medium text-gray-900">
//                     {currentSuccessor
//                       ? "เปลี่ยนผู้รับสืบทอด"
//                       : "ตั้งผู้รับสืบทอด"}
//                   </h3>
//                 </div>
//                 <div className="p-6">
//                   <form onSubmit={handleSetSuccessor}>
//                     <div className="mb-4">
//                       <label
//                         htmlFor="successorAddress"
//                         className="block text-sm font-medium text-gray-700 mb-2"
//                       >
//                         ที่อยู่กระเป๋าเงินผู้รับสืบทอด
//                       </label>
//                       <input
//                         type="text"
//                         id="successorAddress"
//                         value={successorAddress}
//                         onChange={(e) => setSuccessorAddress(e.target.value)}
//                         placeholder="0x..."
//                         className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                         required
//                       />
//                       <p className="mt-1 text-xs text-gray-500">
//                         กรอกที่อยู่กระเป๋าเงิน (Wallet Address)
//                         ของผู้ที่คุณต้องการให้รับสืบทอดสินค้านี้
//                       </p>
//                     </div>

//                     <div className="flex flex-col sm:flex-row gap-3">
//                       <button
//                         type="submit"
//                         disabled={isProcessing}
//                         className="sm:flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
//                       >
//                         {isProcessing
//                           ? "กำลังดำเนินการ..."
//                           : "ตั้งผู้รับสืบทอด"}
//                       </button>

//                       {currentSuccessor && (
//                         <button
//                           type="button"
//                           onClick={handleRemoveSuccessor}
//                           disabled={isProcessing}
//                           className="sm:flex-1 px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
//                         >
//                           {isProcessing
//                             ? "กำลังดำเนินการ..."
//                             : "ยกเลิกผู้รับสืบทอด"}
//                         </button>
//                       )}
//                     </div>
//                   </form>
//                 </div>
//               </div>

//               <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
//                 <h3 className="text-lg font-medium text-gray-900 mb-4">
//                   คำแนะนำในการตั้งผู้รับสืบทอด
//                 </h3>
//                 <ul className="list-disc pl-5 space-y-2 text-gray-600">
//                   <li>ตั้งผู้รับสืบทอดที่คุณไว้วางใจและสามารถติดต่อได้</li>
//                   <li>
//                     แจ้งให้ผู้รับสืบทอดทราบว่าคุณได้ตั้งให้เขาเป็นผู้รับสืบทอดสินค้านี้
//                   </li>
//                   <li>อธิบายขั้นตอนการร้องขอรับสืบทอดให้ผู้รับสืบทอดเข้าใจ</li>
//                   <li>
//                     ตรวจสอบความถูกต้องของที่อยู่กระเป๋าเงินก่อนทำการตั้งค่า
//                   </li>
//                   <li>คุณสามารถเปลี่ยนหรือยกเลิกผู้รับสืบทอดได้ตลอดเวลา</li>
//                 </ul>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </main>
//   );
// }
