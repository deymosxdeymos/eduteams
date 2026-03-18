"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowRight, UserRound } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useId, useMemo, useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { InputRounded } from "@/components/ui/input-rounded";
import { submitDataDiri } from "@/lib/actions/data-diri";

interface DataDiriFormClientProps {
  role: "dosen" | "mahasiswa";
  initialData?: {
    namaLengkap: string;
    nim: string;
    jenisKelamin: string;
    role: string;
  };
}

interface DataDiriValidationMessages {
  namaLengkapMin: string;
  namaLengkapMax: string;
  namaLengkapPattern: string;
  nimMin: string;
  nimMax: string;
  nimPattern: string;
  jenisKelaminRequired: string;
}

const createFormSchema = (role: "dosen" | "mahasiswa", messages: DataDiriValidationMessages) => {
  const baseSchema = {
    namaLengkap: z
      .string()
      .min(2, messages.namaLengkapMin)
      .max(100, messages.namaLengkapMax)
      .regex(/^[\p{L}\p{M}\s\-.']+$/u, messages.namaLengkapPattern),
    jenisKelamin: z.string().min(1, messages.jenisKelaminRequired),
  };

  if (role === "mahasiswa") {
    return z.object({
      ...baseSchema,
      nim: z
        .string()
        .min(8, messages.nimMin)
        .max(15, messages.nimMax)
        .regex(/^\d+$/, messages.nimPattern),
    });
  } else {
    // Dosen only needs name and gender, no NPM
    return z.object(baseSchema);
  }
};

export default function DataDiriFormClient({ role, initialData }: DataDiriFormClientProps) {
  const tDataDiri = useTranslations("onboarding.dataDiri");
  const tValidation = useTranslations("onboarding.dataDiri.validation");
  const formId = "data-diri-form";
  const genderLabelId = useId();
  const namaLengkapId = useId();
  const nimFieldId = useId();
  const namaWrapperRef = useRef<HTMLDivElement>(null);
  const nimWrapperRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const formSchema = useMemo(
    () =>
      createFormSchema(role, {
        namaLengkapMin: tValidation("namaLengkapMin"),
        namaLengkapMax: tValidation("namaLengkapMax"),
        namaLengkapPattern: tValidation("namaLengkapPattern"),
        nimMin: tValidation("nimMin"),
        nimMax: tValidation("nimMax"),
        nimPattern: tValidation("nimPattern"),
        jenisKelaminRequired: tValidation("jenisKelaminRequired"),
      }),
    [role, tValidation],
  );
  type FormData = z.infer<typeof formSchema> & { nim?: string };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      namaLengkap: initialData?.namaLengkap || "",
      jenisKelamin: initialData?.jenisKelamin || "",
      ...(role === "mahasiswa" ? { nim: initialData?.nim || "" } : {}),
    } as FormData,
  });

  function handleSubmit(values: FormData) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("namaLengkap", values.namaLengkap);
      formData.append("jenisKelamin", values.jenisKelamin);
      formData.append("role", role);

      // Only append NIM for mahasiswa (dosen doesn't have NPM anymore)
      if (role === "mahasiswa" && "nim" in values) {
        formData.append("nim", values.nim as string);
      }

      await submitDataDiri(formData);
    });
  }

  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-8 w-full max-w-2xl"
      >
        <div className="flex items-center gap-2 mb-6">
          <span
            className={`text-sm font-medium uppercase tracking-wide ${
              role === "dosen" ? "text-amber-700" : "text-green-700"
            }`}
          >
            ROLE:
          </span>
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-sm ${
              role === "dosen" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
            }`}
          >
            <Image src={`/${role}.svg`} alt={role} width={20} height={20} className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase">
              {role === "mahasiswa" ? "Mahasiswa" : "Dosen"}
            </span>
          </div>
        </div>

        <FormField
          control={form.control}
          name="namaLengkap"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel htmlFor={namaLengkapId} className="text-black text-xl font-normal">
                {tDataDiri("namaLengkap")}
              </FormLabel>
              <FormControl>
                <motion.div ref={namaWrapperRef} className="relative" initial={false}>
                  <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black z-10" />
                  <InputRounded
                    id={namaLengkapId}
                    placeholder={tDataDiri("namaLengkapPlaceholder")}
                    {...field}
                    aria-invalid={!!fieldState.error}
                    animationTargetRef={namaWrapperRef}
                    className="pl-10"
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </motion.div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {role === "mahasiswa" && (
          <FormField
            control={form.control}
            name="nim"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel htmlFor={nimFieldId} className="text-black text-xl font-normal">
                  {tDataDiri("nim")}
                </FormLabel>
                <FormControl>
                  <motion.div ref={nimWrapperRef} className="relative" initial={false}>
                    <Image
                      src="/icons/nim.svg"
                      alt="NIM icon"
                      width={16}
                      height={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-10"
                    />
                    <InputRounded
                      id={nimFieldId}
                      placeholder={tDataDiri("nimPlaceholder")}
                      {...field}
                      aria-invalid={!!fieldState.error}
                      animationTargetRef={nimWrapperRef}
                      className="pl-10"
                      required
                      minLength={8}
                      maxLength={15}
                      pattern="[0-9]+"
                    />
                  </motion.div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="jenisKelamin"
          render={({ field }) => (
            <FormItem>
              <FormLabel id={genderLabelId} className="text-black text-xl font-normal">
                {tDataDiri("jenisKelamin")}
              </FormLabel>
              <FormControl>
                <div
                  className="flex gap-x-4 items-start"
                  role="radiogroup"
                  aria-labelledby={genderLabelId}
                >
                  <motion.button
                    type="button"
                    role="radio"
                    aria-checked={field.value === "laki-laki"}
                    onClick={() => field.onChange("laki-laki")}
                    className={`flex flex-col items-center justify-center rounded-xl w-[6rem] h-[6rem] p-1 cursor-pointer ${
                      field.value === "laki-laki" ? "ring-4 ring-blue-300" : ""
                    }`}
                    animate={{
                      scale: field.value === "laki-laki" ? 1.05 : 1,
                      backgroundColor:
                        field.value === "laki-laki" ? "rgb(219, 234, 254)" : "rgb(244, 244, 245)",
                    }}
                    whileHover={
                      field.value !== "laki-laki"
                        ? {
                            backgroundColor: "rgb(228, 228, 231)",
                            scale: 1.02,
                          }
                        : undefined
                    }
                    whileTap={{ scale: 0.98 }}
                    transition={{
                      type: "spring",
                      duration: 0.2,
                      bounce: 0,
                    }}
                  >
                    <Image
                      src={field.value === "laki-laki" ? "/laki.svg" : "/laki-not-active.svg"}
                      width={80}
                      height={80}
                      alt="laki-laki"
                      className="mb-[-10px] w-auto h-auto"
                    />
                    <p className="font-bold text-center text-blue-950 text-md tracking-tighter leading-none uppercase">
                      {tDataDiri("lakiLaki")}
                    </p>
                  </motion.button>

                  <motion.button
                    type="button"
                    role="radio"
                    aria-checked={field.value === "perempuan"}
                    onClick={() => field.onChange("perempuan")}
                    className={`flex flex-col items-center justify-center rounded-xl w-[6rem] h-[6rem] p-1 cursor-pointer ${
                      field.value === "perempuan" ? "ring-4 ring-pink-300" : ""
                    }`}
                    animate={{
                      scale: field.value === "perempuan" ? 1.05 : 1,
                      backgroundColor:
                        field.value === "perempuan" ? "rgb(252, 231, 243)" : "rgb(244, 244, 245)",
                    }}
                    whileHover={
                      field.value !== "perempuan"
                        ? {
                            backgroundColor: "rgb(228, 228, 231)",
                            scale: 1.02,
                          }
                        : undefined
                    }
                    whileTap={{ scale: 0.98 }}
                    transition={{
                      type: "spring",
                      duration: 0.2,
                      bounce: 0,
                    }}
                  >
                    <Image
                      src={
                        field.value === "perempuan" ? "/perempuan.svg" : "/perempuan-not-active.svg"
                      }
                      width={80}
                      height={80}
                      alt="perempuan"
                      className="mb-[-10px] w-auto h-auto"
                    />
                    <p className="font-bold text-center text-pink-950 text-md tracking-tighter leading-none uppercase">
                      {tDataDiri("perempuan")}
                    </p>
                  </motion.button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>

      {/* Visible submit button with pending state */}
      <div className="flex items-center justify-center gap-x-6 pt-8">
        <Button
          type="submit"
          form="data-diri-form"
          variant="onboarding"
          size="long"
          disabled={isPending}
        >
          {isPending ? tDataDiri("saving") : tDataDiri("continue")}
          {!isPending && <ArrowRight strokeWidth={3} className="font-bold text-white text-lg" />}
          {isPending && (
            <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
        </Button>
      </div>
    </Form>
  );
}
