"use client";

import { createClient } from "@/utils/supabase/client";
import { useAsistenZora } from "@/lib/asisten-zora-context";
import { toast } from "sonner";

interface Props {
  className?: string;
}

// Switch on/off standar (track + thumb), lebih jelas keliatan sebagai kontrol
// dibanding tombol ikon kecil.
export default function AsistenZoraSwitch({ className }: Props) {
  const { aktif, loaded, setAktif } = useAsistenZora();
  const supabase = createClient();

  const toggle = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Silakan login terlebih dahulu.");
      return;
    }

    const next = !aktif;
    setAktif(next); // optimistic update, langsung kesebar ke semua komponen lewat context

    const { error } = await supabase
      .from("profiles")
      .update({ asisten_zora_aktif: next })
      .eq("id", user.id);

    if (error) {
      setAktif(!next); // rollback kalau gagal
      toast.error("Gagal menyimpan pengaturan.");
      return;
    }

    toast.success(next ? "Asisten Zora aktif ✨" : "Asisten Zora dinonaktifkan");
  };

  if (!loaded) {
    return <div className={`w-11 h-6 rounded-full bg-white/20 animate-pulse ${className ?? ""}`} />;
  }

  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={aktif}
      title={aktif ? "Matikan Asisten Zora" : "Aktifkan Asisten Zora"}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors active:scale-95 ${
        aktif ? "bg-emerald-400" : "bg-white/25"
      } ${className ?? ""}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
          aktif ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}