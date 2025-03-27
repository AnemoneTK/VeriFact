# 🔶 VeriFact - ระบบตรวจสอบสินค้าของแท้บนบล็อกเชน

<div align="center">
  <img src="https://via.placeholder.com/200x200.png?text=VeriFact+Logo" alt="VeriFact Logo" width="200"/>
  <p><em>ตรวจสอบความถูกต้อง ติดตามประวัติ และส่งต่อสินค้ามีค่าด้วยเทคโนโลยี Blockchain</em></p>
  <p><strong>CSI301 - การพัฒนา Smart Contract</strong><br>ภาคการศึกษาที่ 1/2567</p>
</div>

## 📄 ข้อมูลโครงงาน

**นักศึกษาผู้พัฒนา:**  
นางสาว นริศรา จ่างสะเดา  
รหัสนักศึกษา: 65039089
คณะเทคโนโลยีสารสนเทศ
สาขาวิชาวิทยาการคอมพิวเตอร์และนวัตกรรมการพัฒนาซอฟต์แวร์

## 📑 สารบัญ

- [🔍 ภาพรวมโครงงาน](#-ภาพรวมโครงงาน)
- [✨ คุณสมบัติหลัก](#-คุณสมบัติหลัก)
- [📱 ส่วนต่างๆ ของแอปพลิเคชัน](#-ส่วนต่างๆ-ของแอปพลิเคชัน)
- [👥 บทบาทผู้ใช้งาน](#-บทบาทผู้ใช้งาน)
- [📊 Smart Contract](#-smart-contract)
- [🛠️ เทคโนโลยีที่ใช้](#️-เทคโนโลยีที่ใช้)
- [🚀 การติดตั้งและการใช้งาน](#-การติดตั้งและการใช้งาน)
- [📚 สิ่งที่ได้เรียนรู้จากโครงงานนี้](#-สิ่งที่ได้เรียนรู้จากโครงงานนี้)
- [👨‍💻 การพัฒนาต่อยอดในอนาคต](#-การพัฒนาต่อยอดในอนาคต)
- [📝 เอกสารอ้างอิง](#-เอกสารอ้างอิง)

## 🔍 ภาพรวมโครงงาน

**VeriFact** เป็นระบบยืนยันความถูกต้องของสินค้าบนเทคโนโลยี Blockchain ที่ช่วยแก้ปัญหาการปลอมแปลงสินค้าในปัจจุบัน โดยใช้คุณสมบัติความโปร่งใส ตรวจสอบย้อนกลับได้ และไม่สามารถแก้ไขข้อมูลได้ของ Blockchain

โปรเจกต์นี้พัฒนาขึ้นเพื่อแสดงให้เห็นถึงศักยภาพของเทคโนโลยี Blockchain ในการประยุกต์ใช้กับปัญหาในโลกความเป็นจริง โดยเฉพาะอย่างยิ่งในอุตสาหกรรมสินค้าแบรนด์เนม งานศิลปะ หรือของสะสมที่มีมูลค่าสูง

ด้วยการใช้ Smart Contract บน Ethereum Blockchain ทำให้ข้อมูลการซื้อขายและประวัติการเป็นเจ้าของสินค้าถูกบันทึกไว้อย่างปลอดภัยและเชื่อถือได้ ไม่สามารถแก้ไขย้อนหลังได้ ทำให้ผู้ซื้อสามารถตรวจสอบความถูกต้องของสินค้าก่อนตัดสินใจซื้อ

## ✨ คุณสมบัติหลัก

- **การตรวจสอบความถูกต้อง** - ผู้ใช้สามารถตรวจสอบความถูกต้องของสินค้าผ่านการสแกน QR Code หรือกรอกรหัสสินค้า
- **การติดตามประวัติการถือครอง** - ระบบแสดงประวัติทั้งหมดของสินค้า ทั้งเจ้าของปัจจุบันและเจ้าของคนก่อนๆ
- **การโอนกรรมสิทธิ์** - เจ้าของสามารถโอนสินค้าไปยังผู้อื่นได้อย่างปลอดภัยด้วย Smart Contract
- **ระบบแดชบอร์ด** - แสดงและจัดการสินค้าที่ผู้ใช้เป็นเจ้าของทั้งหมด
- **ระบบสำหรับผู้ขาย** - ผู้ขายที่ได้รับการรับรองสามารถลงทะเบียนสินค้าใหม่เข้าสู่ระบบ
- **การเชื่อมต่อกระเป๋าเงิน** - รองรับการเชื่อมต่อกับ Ethereum Wallet (Metamask) เพื่อยืนยันตัวตน

## 📱 ส่วนต่างๆ ของแอปพลิเคชัน

### 🏠 หน้าหลัก (Homepage)
หน้าหลักแสดงข้อมูลทั่วไปเกี่ยวกับ VeriFact อธิบายวิธีการทำงานของแพลตฟอร์ม และแสดงสินค้าล่าสุดที่ลงทะเบียนในระบบ

### 🔍 หน้าตรวจสอบสินค้า (Verify)
ผู้ใช้สามารถกรอกรหัสสินค้าหรือสแกน QR Code เพื่อตรวจสอบความถูกต้องของสินค้า โดยจะแสดงข้อมูลสินค้า เจ้าของปัจจุบัน และประวัติการถือครอง

### 🔄 หน้าโอนสินค้า (Transfer)
เจ้าของสินค้าสามารถใช้หน้านี้ในการโอนกรรมสิทธิ์สินค้าให้กับผู้อื่น โดยระบุที่อยู่กระเป๋าเงินของผู้รับและราคาโอน

### 📊 แดชบอร์ดผู้ใช้งาน (Dashboard)
แสดงสินค้าทั้งหมดที่ผู้ใช้เป็นเจ้าของ พร้อมตัวเลือกในการตรวจสอบหรือโอนสินค้าแต่ละชิ้น

### 👨‍💼 แดชบอร์ดผู้ขาย (Seller Dashboard)
สำหรับผู้ขายที่ได้รับการรับรอง (admin) สามารถลงทะเบียนสินค้าใหม่เข้าสู่ระบบและจัดการสินค้าเดิม

### 👤 หน้าโปรไฟล์ (Profile)
แสดงข้อมูลผู้ใช้และกระเป๋าเงินที่เชื่อมต่อ พร้อมคำแนะนำวิธีการได้รับ ETH ทดสอบบน Holesky Testnet

## 👥 บทบาทผู้ใช้งาน

### 👨‍💼 ผู้ขาย (Admin)
- ลงทะเบียนสินค้าใหม่เข้าสู่ระบบ
- เปิดหรือระงับการใช้งานสินค้า
- ตรวจสอบและจัดการสินค้าทั้งหมดในระบบ
- โอนสิทธิ์ Admin ให้ผู้อื่น

### 👤 ผู้ใช้งานทั่วไป (User)
- ตรวจสอบความถูกต้องของสินค้า
- ดูประวัติการถือครองสินค้า
- โอนสินค้าที่ตนเองเป็นเจ้าของให้ผู้อื่น
- จัดการสินค้าที่ตนเองเป็นเจ้าของในแดชบอร์ด

## 📊 Smart Contract

Smart Contract ของ VeriFact ประกอบด้วยฟังก์ชันหลักดังนี้:

- **registerProduct** - ลงทะเบียนสินค้าใหม่เข้าสู่ระบบ
- **transferProduct** - โอนสินค้าจากเจ้าของปัจจุบันไปยังเจ้าของใหม่
- **verifyProduct** - ตรวจสอบความถูกต้องของสินค้า
- **getProduct** - ดึงข้อมูลของสินค้า
- **getTransferHistory** - ดึงประวัติการโอนของสินค้า
- **getProductsByOwner** - ดึงรายการสินค้าทั้งหมดของเจ้าของ
- **setProductStatus** - เปิดหรือระงับการใช้งานสินค้า (เฉพาะ Admin)
- **transferAdmin** - โอนสิทธิ์ Admin ให้ผู้อื่น (เฉพาะ Admin)

## 🛠️ เทคโนโลยีที่ใช้

- **Frontend:** Next.js, TailwindCSS
- **Blockchain Integration:** Web3.js, Ethereum
- **Smart Contract:** Solidity (v0.8.26)
- **Authentication:** NextAuth.js, Ethereum wallet authentication
- **Testing Network:** Holesky Testnet (Ethereum)
- **Styling:** TailwindCSS, Responsive Design
- **State Management:** React Context API
- **Development Environment:** Visual Studio Code, Git

## 🚀 การติดตั้งและการใช้งาน

### ข้อกำหนดเบื้องต้น

- Node.js (v18 หรือใหม่กว่า)
- npm หรือ yarn
- MetaMask Extension (สำหรับการเชื่อมต่อกับ Ethereum blockchain)
- บัญชี Ethereum ที่มี ETH ในเครือข่าย Holesky Testnet

### ขั้นตอนการติดตั้ง

1. **ดาวน์โหลดโปรเจกต์**

```bash
git clone https://github.com/AnemoneTK/verifact.git
cd verifact
```

2. **ติดตั้ง Dependencies**

```bash
npm install
# หรือ
yarn install
```

3. **ตั้งค่า Environment Variables**

สร้างไฟล์ `.env.local` ในโฟลเดอร์หลักและเพิ่มค่าต่อไปนี้:

```env
NEXT_PUBLIC_VERIFACT_CONTRACT_ADDRESS="0x..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
```

4. **เริ่มต้นแอปพลิเคชันในโหมดพัฒนา**

```bash
npm run dev
# หรือ
yarn dev
```

เข้าถึงแอปพลิเคชันได้ที่ `http://localhost:3000`

### การ Deploy Smart Contract

Smart Contract ของ VeriFact ได้ถูก Deploy บน Holesky Testnet แล้ว ผู้ใช้สามารถใช้งานได้โดยเชื่อมต่อกับที่อยู่ที่กำหนดไว้ใน Environment Variable `NEXT_PUBLIC_VERIFACT_CONTRACT_ADDRESS`

หากต้องการ Deploy Smart Contract ใหม่:

1. **ใช้ Remix IDE** 
   - เข้าไปที่ [Remix IDE](https://remix.ethereum.org/) เครื่องมือออนไลน์สำหรับการพัฒนาและ Deploy Smart Contract

2. **ขั้นตอนการ Deploy**
   - อัปโหลดไฟล์ Smart Contract ไปยัง Remix
   - Compile Smart Contract
   - เชื่อมต่อ MetaMask กับเครือข่าย Holesky Testnet
   - Deploy Smart Contract
   - บันทึกที่อยู่ Contract Address ที่ได้รับ

3. **อัปเดต Environment Variable**
   - แก้ไขที่อยู่ Contract ใน `.env.local`
   - รีสตาร์ทแอปพลิเคชัน

## 📚 สิ่งที่ได้เรียนรู้จากโครงงานนี้

การพัฒนาโครงงาน VeriFact ทำให้ได้เรียนรู้และฝึกทักษะหลายด้าน:

1. **การพัฒนาเว็บแอปพลิเคชันสมัยใหม่** - ได้เรียนรู้การใช้ Next.js ในการสร้างเว็บแอปพลิเคชันที่มีประสิทธิภาพและรองรับการทำงานหลายอุปกรณ์

2. **การพัฒนา Smart Contract** - ได้เรียนรู้การเขียนและทดสอบ Smart Contract ด้วยภาษา Solidity บนเครือข่าย Ethereum

3. **การบูรณาการ Blockchain กับแอปพลิเคชัน** - ได้เรียนรู้วิธีการเชื่อมต่อระหว่างแอปพลิเคชัน Frontend กับ Smart Contract ผ่าน Web3.js

4. **การออกแบบระบบ Authentication** - ได้เรียนรู้การพัฒนาระบบยืนยันตัวตนที่ใช้ Ethereum Wallet และ NextAuth.js

5. **การทำงานกับ Testnet** - ได้เรียนรู้การทดสอบและ Deploy แอปพลิเคชันบนเครือข่าย Testnet (Holesky)

6. **การจัดการ State ในแอปพลิเคชัน React** - ได้เรียนรู้การจัดการ State ที่ซับซ้อนด้วย Context API ในโปรเจกต์ขนาดใหญ่

7. **การออกแบบ UI/UX ที่เป็นมิตรกับผู้ใช้** - ได้เรียนรู้การออกแบบส่วนติดต่อผู้ใช้ที่สวยงามและใช้งานง่ายด้วย TailwindCSS

## 👨‍💻 การพัฒนาต่อยอดในอนาคต

ในอนาคต VeriFact สามารถพัฒนาต่อยอดเพิ่มเติมได้ดังนี้:

1. **ตลาดซื้อขาย** - พัฒนาระบบตลาดซื้อขายสินค้าภายในแพลตฟอร์ม
2. **ระบบประมูล** - เพิ่มฟังก์ชันการประมูลสินค้ามูลค่าสูง
3. **การบูรณาการกับ NFT** - เชื่อมโยงสินค้าจริงกับ NFT บนบล็อกเชน
4. **รองรับหลาย Blockchain** - ขยายการรองรับไปยังบล็อกเชนอื่นๆ นอกเหนือจาก Ethereum
5. **ระบบยืนยันตัวตน KYC** - เพิ่มการยืนยันตัวตนผู้ใช้งานเพื่อความปลอดภัยมากขึ้น
6. **แอปพลิเคชันมือถือ** - พัฒนาเวอร์ชันแอปพลิเคชันบนมือถือสำหรับความสะดวกในการใช้งาน
7. **การแจ้งเตือนแบบเรียลไทม์** - เพิ่มระบบแจ้งเตือนเมื่อมีการเปลี่ยนแปลงกรรมสิทธิ์สินค้า

## 📝 เอกสารอ้างอิง

1. Ethereum. (2023). *Ethereum Development Documentation*. [https://ethereum.org/developers/docs/](https://ethereum.org/developers/docs/)

2. Solidity. (2023). *Solidity Documentation*. [https://docs.soliditylang.org/](https://docs.soliditylang.org/)

3. Web3.js. (2023). *Web3.js Documentation*. [https://web3js.readthedocs.io/](https://web3js.readthedocs.io/)

4. Next.js. (2023). *Next.js Documentation*. [https://nextjs.org/docs](https://nextjs.org/docs)

5. TailwindCSS. (2023). *TailwindCSS Documentation*. [https://tailwindcss.com/docs](https://tailwindcss.com/docs)

6. React. (2023). *React Documentation*. [https://reactjs.org/docs/getting-started.html](https://reactjs.org/docs/getting-started.html)

7. NextAuth.js. (2023). *NextAuth.js Documentation*. [https://next-auth.js.org/](https://next-auth.js.org/)

8. MetaMask. (2023). *MetaMask Developer Documentation*. [https://docs.metamask.io/](https://docs.metamask.io/)

9. Holesky Testnet. (2023). *Holesky Testnet Documentation*. [https://holesky.etherscan.io/](https://holesky.etherscan.io/)

---

<div align="center">
  <p>พัฒนาด้วย ❤️ โดย นางสาว นริศรา จ่างสะเดา</p>
</div>
