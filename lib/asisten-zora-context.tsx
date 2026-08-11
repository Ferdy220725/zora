"use client";

// Context ini yang bikin toggle di Navbar (beda pohon komponen dari halaman Dashboard)
// bisa langsung nyinkron statusnya ke halaman manapun yang lagi dibuka, tanpa reload.

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";

interface AsistenZoraContextValue {
  aktif: boolean;
  loaded: boolean;
  setAktif: (v: boolean) => void; // dipanggil ToggleAsistenZora setelah berhasil update ke Supabase
}

const AsistenZoraContext = createContext<AsistenZoraContextValue>({
  aktif: false,
  loaded: false,
  setAktif: () => {},
});

export function AsistenZoraProvider({ children }: { children: ReactNode }) {
  const [aktif, setAktifState] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoaded(true);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("asisten_zora_aktif")
        .eq("id", user.id)
        .maybeSingle();
      setAktifState(data?.asisten_zora_aktif ?? false);
      setLoaded(true);
    };
    load();
  }, []);

  return (
    <AsistenZoraContext.Provider value={{ aktif, loaded, setAktif: setAktifState }}>
      {children}
    </AsistenZoraContext.Provider>
  );
}

export function useAsistenZora() {
  return useContext(AsistenZoraContext);
}