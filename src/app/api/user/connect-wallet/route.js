import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { walletAddress } = await request.json();

    // อัปเดตข้อมูล wallet ของผู้ใช้
    await prisma.user.update({
      where: { id: session.user.id },
      data: { walletAddress },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error connecting wallet:", error);
    return NextResponse.json(
      { error: "Failed to connect wallet" },
      { status: 500 }
    );
  }
}
