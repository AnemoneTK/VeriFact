import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>404 - Page Not Found</h1>
      <p>หน้าที่คุณกำลังมองหาไม่มีอยู่</p>
      <Link to={"/"} style={{ textDecoration: "underline" }}>
        กลับสู่หน้าหลัก
      </Link>
    </div>
  );
}
