"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/api-utils";
import { isActiveDemoAccountEmail, parseDemoRoleFromEmail } from "@/lib/demo/auth";
import { refreshDemoSandboxSessionCookie } from "@/lib/demo/sandbox-cookie";
import prisma from "@/lib/prisma";
import { AuthError, AuthorizationError, ValidationError } from "@/lib/types";
import { genderToLabel, labelToGender } from "@/lib/utils/gender";

const dataDiriSchema = z.object({
  namaLengkap: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  nim: z.string().optional().nullable(),
  jenisKelamin: z.enum(["laki-laki", "perempuan"]),
  role: z.enum(["dosen", "mahasiswa"]),
});

export async function submitDataDiri(formData: FormData, getCurrentUserImpl = getCurrentUser) {
  const user = await getCurrentUserImpl();
  if (!user) {
    throw new AuthError("Authentication required");
  }

  const rawData = {
    namaLengkap: formData.get("namaLengkap") as string,
    nim: formData.get("nim") as string,
    jenisKelamin: formData.get("jenisKelamin") as string,
    role: formData.get("role") as string,
  };

  const validatedData = dataDiriSchema.parse(rawData);
  const { namaLengkap, nim, jenisKelamin, role } = validatedData;

  if (role === "mahasiswa" && !nim) {
    throw new ValidationError("NIM is required for mahasiswa");
  }

  const gender = labelToGender(jenisKelamin);
  const dbRole = role === "dosen" ? "TEACHER" : "STUDENT";
  const demoRole = isActiveDemoAccountEmail(user.email) ? parseDemoRoleFromEmail(user.email) : null;

  if (demoRole && demoRole !== dbRole) {
    throw new AuthorizationError("Demo accounts cannot switch role scope");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: namaLengkap,
      nim: role === "mahasiswa" ? nim : null,
      role: dbRole,
      gender,
      isOnboarded: role === "dosen",
      onboardingStep: role === "mahasiswa" ? "kepribadian" : null,
    },
  });
  await refreshDemoSandboxSessionCookie(user, {
    role: dbRole,
    onboarded: role === "dosen",
  });

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");

  if (role === "mahasiswa") {
    redirect("/onboarding/kepribadian");
  } else {
    redirect("/dashboard?firstVisit=true");
  }
}

export async function getDataDiri(getCurrentUserImpl = getCurrentUser) {
  const user = await getCurrentUserImpl();
  if (!user) {
    throw new AuthError("Authentication required");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      nim: true,
      role: true,
      gender: true,
    },
  });

  if (!currentUser) {
    throw new Error("User not found");
  }

  const jenisKelamin = genderToLabel(currentUser.gender);

  return {
    namaLengkap: currentUser.name || "",
    nim: currentUser.nim || "",
    jenisKelamin,
    role: currentUser.role || "",
  };
}
