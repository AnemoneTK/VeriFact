"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { useToast } from "@/contexts/ToastContext";

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const { account, isConnected, networkId } = useWeb3();
  const { showError, showSuccess } = useToast();
  const router = useRouter();

  // สำหรับคัดลอกที่อยู่กระเป๋าเงิน
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // ถ้าไม่ได้เข้าสู่ระบบ ให้นำทางไปหน้าล็อกอิน
    if (!isAuthenticated) {
      showError("กรุณาเชื่อมต่อกระเป๋าเงินก่อนเข้าใช้งาน");
      router.push("/auth/login");
    }
  }, [isAuthenticated, router, showError]);

  // ฟังก์ชันคัดลอกที่อยู่กระเป๋าเงิน
  const copyWalletAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      showSuccess("คัดลอกที่อยู่กระเป๋าเงินแล้ว");
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // แปลงเลข network ID เป็นชื่อ network
  const getNetworkName = (netId) => {
    switch (netId) {
      case 1:
        return "Ethereum Mainnet";
      case 17000:
        return "Holesky Testnet";
      case 3:
        return "Ropsten Test Network";
      case 4:
        return "Rinkeby Test Network";
      case 5:
        return "Goerli Test Network";
      case 42:
        return "Kovan Test Network";
      case 56:
        return "Binance Smart Chain";
      case 97:
        return "Binance Smart Chain Testnet";
      case 137:
        return "Polygon Mainnet";
      case 80001:
        return "Mumbai Test Network";
      default:
        return "Unknown Network";
    }
  };

  // ตรวจสอบว่าเป็น network ที่แนะนำหรือไม่ (ในที่นี้คือ Holesky)
  const isRecommendedNetwork = networkId === 17000;

  // หากยังไม่ได้เชื่อมต่อ wallet ให้แสดงหน้าโหลด
  if (!isConnected || !account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            กลับไปที่แดชบอร์ด
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="bg-blue-600 text-white px-6 py-4">
            <h1 className="text-2xl font-bold">ข้อมูลส่วนตัว</h1>
          </div>

          <div className="p-6">
            <div className="border-gray-200 ">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ข้อมูลกระเป๋าเงิน
              </h3>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-500">
                      ที่อยู่กระเป๋าเงิน
                    </span>
                    <button
                      onClick={copyWalletAddress}
                      className={`text-xs ${
                        copied
                          ? "text-green-600"
                          : "text-blue-600 hover:text-blue-800"
                      }`}
                    >
                      {copied ? "คัดลอกแล้ว" : "คัดลอก"}
                    </button>
                  </div>
                  <p className="text-sm font-mono break-all bg-white p-3 rounded border border-gray-200">
                    {account}
                  </p>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    เครือข่าย
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`px-3 py-2 rounded ${
                        isRecommendedNetwork
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isRecommendedNetwork
                              ? "bg-green-500"
                              : "bg-yellow-500"
                          } mr-2`}
                        ></div>
                        <span>{getNetworkName(networkId)}</span>
                      </div>
                    </div>

                    {!isRecommendedNetwork && (
                      <div className="ml-3">
                        <button
                          onClick={async () => {
                            try {
                              await window.ethereum.request({
                                method: "wallet_switchEthereumChain",
                                params: [{ chainId: "0x4268" }], // 0x4268 = 17000 (Holesky)
                              });
                            } catch (switchError) {
                              // ถ้าไม่มี Holesky ใน network list ให้เพิ่ม
                              if (switchError.code === 4902) {
                                try {
                                  await window.ethereum.request({
                                    method: "wallet_addEthereumChain",
                                    params: [
                                      {
                                        chainId: "0x4268",
                                        chainName: "Holesky Testnet",
                                        nativeCurrency: {
                                          name: "Holesky ETH",
                                          symbol: "ETH",
                                          decimals: 18,
                                        },
                                        rpcUrls: [
                                          "https://ethereum-holesky.publicnode.com",
                                        ],
                                        blockExplorerUrls: [
                                          "https://holesky.etherscan.io/",
                                        ],
                                      },
                                    ],
                                  });
                                } catch (addError) {
                                  showError(
                                    "เกิดข้อผิดพลาดในการเพิ่มเครือข่าย Holesky"
                                  );
                                  console.error(
                                    "Error adding Holesky network:",
                                    addError
                                  );
                                }
                              } else {
                                showError(
                                  "เกิดข้อผิดพลาดในการเปลี่ยนเครือข่าย"
                                );
                                console.error(
                                  "Error switching to Holesky network:",
                                  switchError
                                );
                              }
                            }
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          สลับไป Holesky Testnet
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isRecommendedNetwork && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-green-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">
                        คุณกำลังใช้งาน Holesky Testnet
                        ซึ่งเป็นเครือข่ายที่แนะนำสำหรับการทดสอบ
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                วิธีรับ ETH ทดสอบบน Holesky Testnet
              </h3>

              <div className="space-y-4">
                <p className="text-gray-700">
                  คุณสามารถรับ ETH ทดสอบสำหรับใช้บน Holesky Testnet ได้จาก
                  Faucet ต่อไปนี้:
                </p>

                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  <li>
                    <a
                      href="https://holesky-faucet.pk910.de/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Holesky PoW Faucet
                    </a>
                    <span className="block text-sm text-gray-500 mt-1">
                      ทำ Proof of Work เพื่อรับ ETH ทดสอบ
                    </span>
                  </li>
                  <li>
                    <a
                      href="https://www.holescan.io/faucet"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Holescan Faucet
                    </a>
                    <span className="block text-sm text-gray-500 mt-1">
                      สามารถรับ ETH ทดสอบได้ทุก 24 ชั่วโมง
                    </span>
                  </li>
                </ul>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-blue-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h2a1 1 0 000-2H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        ETH บน Holesky เป็น ETH สำหรับทดสอบเท่านั้น
                        ไม่มีมูลค่าจริง
                        สามารถใช้สำหรับทดสอบการทำธุรกรรมและการโต้ตอบกับสมาร์ทคอนแทร็กต์ได้
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                คำแนะนำการใช้งาน
              </h3>

              <div className="bg-gray-50 rounded-lg p-4">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-blue-500 mr-2 mt-0.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      เมื่อคุณเชื่อมต่อกระเป๋าเงินแล้ว คุณสามารถตรวจสอบสินค้า
                      และยืนยันความถูกต้องได้
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-blue-500 mr-2 mt-0.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      คุณสามารถโอนสินค้าที่คุณเป็นเจ้าของไปยังกระเป๋าเงินอื่นได้
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-blue-500 mr-2 mt-0.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      สินค้าที่ลงทะเบียนบนบล็อกเชนไม่สามารถแก้ไขประวัติการโอนย้อนหลังได้
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-blue-500 mr-2 mt-0.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      ทุกธุรกรรมบนบล็อกเชนต้องใช้ gas (ETH) ในการดำเนินการ
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              การตั้งค่าความปลอดภัย
            </h2>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-2">
                การรักษาความปลอดภัยกระเป๋าเงิน
              </h3>
              <p className="text-gray-700 mb-4">
                คำแนะนำในการรักษาความปลอดภัยของกระเป๋าเงินของคุณ:
              </p>

              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>
                  อย่าเปิดเผย Private Key หรือ Seed Phrase ของคุณกับผู้อื่น
                </li>
                <li>ตรวจสอบแอดเดรสปลายทางทุกครั้งก่อนทำธุรกรรม</li>
                <li>
                  ใช้ hardware wallet เช่น Ledger หรือ Trezor
                  สำหรับเก็บสินทรัพย์ที่มีมูลค่าสูง
                </li>
                <li>
                  พิจารณาการใช้ธุรกรรมแบบ Multi-signature
                  สำหรับระดับความปลอดภัยที่สูงขึ้น
                </li>
              </ul>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-md font-medium text-gray-900 mb-2">
                ลิงก์ที่เป็นประโยชน์
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <a
                  href="https://holesky.etherscan.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div className="rounded-full bg-blue-100 p-2 mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Holesky Etherscan</p>
                    <p className="text-xs text-gray-500">
                      ตรวจสอบธุรกรรมและสัญญาบน Holesky
                    </p>
                  </div>
                </a>

                <a
                  href="https://ethereum-holesky.publicnode.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div className="rounded-full bg-blue-100 p-2 mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Holesky Public Node</p>
                    <p className="text-xs text-gray-500">
                      RPC สาธารณะสำหรับการเข้าถึง Holesky
                    </p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
