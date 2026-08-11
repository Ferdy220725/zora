"use client";

import { Sparkles } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAsistenZora } from "@/lib/asisten-zora-context";
import { toast } from "sonner";

// Tombol ini gantiin posisi tab "Notifikasi" di bottom tab bar mobile (sebelah "Profil"),
// dipakai buat nyalain/matiin Asisten Zora langsung dari situ.
export default function AsistenZoraTabButton() {
  const { aktif, loaded, setAktif } = useAsistenZora();
  const supabase = createClient();

  const toggle = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Silakan login terlebih dahulu.");
      return;
    }

    const next = !aktif;
    setAktif(next);

    const { error } = await supabase
      .from("profiles")
      .update({ asisten_zora_aktif: next })
      .eq("id", user.id);

    if (error) {
      setAktif(!next);
      toast.error("Gagal menyimpan pengaturan.");
      return;
    }

    toast.success(next ? "Asisten Zora aktif ✨" : "Asisten Zora dinonaktifkan");
  };

  return (
    <button
      onClick={toggle}
      disabled={!loaded}
      role="switch"
      aria-checked={aktif}
      className={`flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-bold transition-colors ${
        aktif ? "text-indigo-600" : "text-slate-400 dark:text-slate-500"
      }`}
    >
      <span className="relative">
        <Sparkles size={22} />
        {/* Titik kecil penanda status aktif, biar ada indikator visual di ikon juga */}
        {aktif && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-[#0d0d0d]" />
        )}
      </span>
      Asisten
    </button>
  );
}