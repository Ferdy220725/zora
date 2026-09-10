import { Suspense } from "react";
import AbsensiMahasiswa from "./absensi-client";
import { Loader2 } from "lucide-react";

export default function AbsensiPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#f7f7fb] dark:bg-[#0a0a0a]">
          <Loader2 className="animate-spin text-indigo-600" size={28} />
        </div>
      }
    >
      <AbsensiMahasiswa />
    </Suspense>
  );
}