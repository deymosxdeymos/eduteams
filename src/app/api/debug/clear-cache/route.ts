import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withRole, withValidation } from "@/lib/api-utils";

const clearCacheSchema = z.object({
  tag: z.string().min(1, "Tag is required"),
});

export const POST = withRole(
  "ADMIN",
  withValidation(
    (data: unknown) => clearCacheSchema.parse(data),
    async (_request: NextRequest, { validatedData }) => {
      const { tag } = validatedData;
      revalidateTag(tag);
      return NextResponse.json({
        success: true,
        message: `Cache cleared for tag: ${tag}`,
      });
    },
  ),
);
