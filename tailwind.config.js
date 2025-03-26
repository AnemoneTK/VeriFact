// tailwind.config.js
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // สีหลัก
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        // สีรอง
        secondary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        // สีสำหรับสินค้าของแท้
        authentic: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        // สีสำหรับสินค้าปลอม
        fake: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Thai", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 15px 5px rgba(99, 102, 241, 0.3)",
        "glow-lg": "0 0 25px 10px rgba(99, 102, 241, 0.4)",
        "glow-xl": "0 0 35px 15px rgba(99, 102, 241, 0.5)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-medium": "float-medium 8s ease-in-out infinite",
        "float-slow": "float-slow 10s ease-in-out infinite",
        "bounce-slow": "bounce 3s infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(12deg)" },
          "50%": { transform: "translateY(-20px) rotate(12deg)" },
        },
        "float-medium": {
          "0%, 100%": { transform: "translateY(0px) rotate(6deg)" },
          "50%": { transform: "translateY(-15px) rotate(6deg)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px) rotate(-12deg)" },
          "50%": { transform: "translateY(-10px) rotate(-12deg)" },
        },
      },
      backgroundImage: {
        "grid-white":
          "url(\"data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.25 0C0.559644 0 0 0.559644 0 1.25V28.75C0 29.4404 0.559644 30 1.25 30H28.75C29.4404 30 30 29.4404 30 28.75V1.25C30 0.559644 29.4404 0 28.75 0H1.25ZM1 1.25C1 1.11193 1.11193 1 1.25 1H28.75C28.8881 1 29 1.11193 29 1.25V28.75C29 28.8881 28.8881 29 28.75 29H1.25C1.11193 29 1 28.8881 1 28.75V1.25Z' fill='white'/%3E%3C/svg%3E%0A\")",
      },
      fontFamily: {
        prompt: ["var(--font-prompt)", "sans-serif"],
      },
      // สามารถเพิ่มน้ำหนักฟอนต์หรือขนาดฟอนต์เพิ่มเติมได้ที่นี่
      fontWeight: {
        light: "300",
        normal: "400",
        medium: "500",
        bold: "700",
      },
      // เพิ่มขนาดฟอนต์ที่ต้องการใช้เพิ่มเติม
      fontSize: {
        // คุณสามารถเพิ่มขนาดฟอนต์ที่ต้องการใช้ได้ที่นี่
        "2.5xl": "1.75rem",
      },
    },
  },
  plugins: [],
};
