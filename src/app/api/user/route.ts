import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ data: null }, { status: 401 });
    }

    return NextResponse.json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Failed to get user:", error);
    return NextResponse.json({ data: null }, { status: 500 });
  }
}
