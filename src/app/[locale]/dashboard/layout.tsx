import { NuqsAdapter } from "nuqs/adapters/next/app";
import { SWRProvider } from "@/lib/swr-provider";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SWRProvider>
      <NuqsAdapter>{children}</NuqsAdapter>
    </SWRProvider>
  );
}
