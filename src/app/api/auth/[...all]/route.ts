import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse, type NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  return toNextJsHandler(getAuth()).GET(request);
}

export async function POST(request: NextRequest) {
  const { shouldBlockPublicDemoCredentialAuth } = await import("@/lib/auth");

  if (shouldBlockPublicDemoCredentialAuth?.(request) ?? false) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return toNextJsHandler(getAuth()).POST(request);
}
