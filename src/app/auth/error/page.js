"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const errorType = searchParams.get("error");
    let errorMessage = "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";

    switch (errorType) {
      case "Signin":
        errorMessage = "ไม่สามารถเข้าสู่ระบบได้ โปรดลองอีกครั้ง";
        break;
      case "OAuthSignin":
        errorMessage = "เกิดข้อผิดพลาดในการเริ่มต้นเข้าสู่ระบบด้วย OAuth";
        break;
      case "OAuthCallback":
        errorMessage = "เกิดข้อผิดพลาดในการเรียกข้อมูลจาก OAuth";
        break;
      case "OAuthCreateAccount":
        errorMessage = "ไม่สามารถสร้างบัญชีผู้ใช้ด้วย OAuth ได้";
        break;
      case "EmailCreateAccount":
        errorMessage = "ไม่สามารถสร้างบัญชีผู้ใช้ด้วยอีเมลได้";
        break;
      case "Callback":
        errorMessage = "เกิดข้อผิดพลาดในการตอบกลับจากการยืนยันตัวตน";
        break;
      case "AccessDenied":
        errorMessage = "คุณไม่มีสิทธิ์เข้าถึงหน้านี้";
        break;
      case "CredentialsSignin":
        errorMessage = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
        break;
      case "default":
        errorMessage = "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
        break;
    }

    setError(errorMessage);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-600 p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          เกิดข้อผิดพลาด
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          ไม่สามารถเข้าสู่ระบบได้ในขณะนี้
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-4">
            <Link
              href="/auth/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              ลองอีกครั้ง
            </Link>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
