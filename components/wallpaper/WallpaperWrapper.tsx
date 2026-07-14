"use client"; // INI WAJIB ADA

import { useState } from "react";
import TemplatePicker from "./TemplatePicker";

export default function WallpaperWrapper() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fungsi handleSelect tinggal di dalam file ini saja
  const handleSelect = (id: string) => {
    setSelectedId(id);
    console.log("Template dipilih:", id);
  };

  return (
    <TemplatePicker 
      selectedId={selectedId} 
      onSelect={handleSelect} 
    />
  );
}