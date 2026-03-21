"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/api-utils";
import { canStartTeacherOnboarding } from "@/lib/authorization";
import { getInstitutionalEmailRequiredRolePath } from "@/lib/onboarding/role-errors";
import prisma from "@/lib/prisma";
import { AuthError } from "@/lib/types";

const roleSchema = z.object({
  role: z
    .enum(["dosen", "mahasiswa"])
    .transform((val) => (val === "dosen" ? "TEACHER" : "STUDENT")),
});

export async function submitRole(formData: FormData, getCurrentUserImpl = getCurrentUser) {
  const user = await getCurrentUserImpl();
  if (!user) {
    throw new AuthError("Authentication required");
  }

  const rawData = {
    role: formData.get("role") as string,
  };

  const validatedData = roleSchema.safeParse(rawData);
  if (!validatedData.success) {
    redirect("/onboarding/role");
  }

  const { role } = validatedData.data;

  if (role === "TEACHER" && !canStartTeacherOnboarding(user)) {
    redirect(getInstitutionalEmailRequiredRolePath());
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      role,
      onboardingStep: "role",
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");

  const roleSlug = role === "TEACHER" ? "dosen" : "mahasiswa";

  redirect(`/onboarding/data-diri/${roleSlug}`);
}
