import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Ethereum",
      credentials: {
        address: { label: "Address", type: "text" },
        signature: { label: "Signature", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.address) {
            return null;
          }

          // ในกรณีนี้เราจะใช้ address เป็นข้อมูลการระบุตัวตน
          // ไม่จำเป็นต้องตรวจสอบลายเซ็นในตัวอย่างนี้
          // แต่ในสภาพแวดล้อมจริงควรตรวจสอบลายเซ็นด้วย ethers หรือ web3.js

          return {
            id: credentials.address,
            name: `${credentials.address.substring(
              0,
              6
            )}...${credentials.address.substring(
              credentials.address.length - 4
            )}`,
            email: null,
            image: null,
            address: credentials.address,
          };
        } catch (error) {
          console.error("Wallet auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 วัน
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.address = user.address;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.address = token.address;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
