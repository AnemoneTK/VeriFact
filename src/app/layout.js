// src/app/layout.js
import { Providers } from "./providers";
// import "@/styles/globals.css";
import "../styles/globals.css";
import { Prompt } from "next/font/google";

// const prompt = Prompt({ subsets: ["latin"] });
const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
  variable: "--font-prompt",
});

export const metadata = {
  title: "VeriFact - ระบบตรวจสอบสินค้าของแท้บนบล็อกเชน",
  description:
    "ตรวจสอบความถูกต้อง ติดตามประวัติ และส่งต่อสินค้ามีค่าด้วยเทคโนโลยี Blockchain",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="th"
      // className={` ${ibmPlexSansThai.variable} ${prompt.variable}`}
    >
      <body className={prompt.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
