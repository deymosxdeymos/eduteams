import { NextResponse } from "next/server";
import { getEdu2comWeights } from "@/lib/edu2com/config";

export async function GET() {
  const weights = getEdu2comWeights();
  return NextResponse.json({
    alpha: weights.alpha,
    beta: weights.beta,
    delta: weights.delta,
  });
}
