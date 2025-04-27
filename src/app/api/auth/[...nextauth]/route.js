// src/app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// ตั้งค่า NextAuth ตามที่ต้องการ
const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        address: { label: "Address", type: "text" },
      },
      async authorize(credentials) {
        // ตรวจสอบและคืนค่า user object
        if (credentials.address) {
          return {
            id: credentials.address,
            address: credentials.address,
            name:
              credentials.address.slice(0, 6) +
              "..." +
              credentials.address.slice(-4),
          };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (token && token.sub) {
        session.user = {
          ...session.user,
          id: token.sub,
          address: token.sub,
        };
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
