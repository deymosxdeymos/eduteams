import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-600">
      <div className="w-full flex flex-col items-center justify-center p-6">
        <Image src="/404.svg" alt="Not Found" width={900} height={900} className="mb-6" />
        <div className="text-center">
          <p className="max-w-xl text-lg text-white mb-4 leading-tight">
            Halaman ini tidak lagi tersedia atau telah dihapus. Jangan khawatir, kamu bisa kembali
            ke halaman utama untuk melanjutkan.
          </p>
          <Button
            asChild
            variant="outline"
            className="rounded-full w-full sm:w-auto px-6 h-12 transition-[background-color,border-color,color,transform] duration-200 ease-[ease] active:scale-[0.98] motion-reduce:active:scale-100"
          >
            <Link href="/">
              <ArrowLeft strokeWidth={3} className="w-4 h-4" />
              Kembali ke Halaman Utama
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
