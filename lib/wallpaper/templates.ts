// lib/wallpaper/templates.ts
import { ComponentType, RefAttributes } from "react";
import { JadwalWallpaperData } from "./types";
import PastelSoftTemplate from "@/components/wallpaper/PastelSoftTemplate";
import MinimalCleanTemplate from "@/components/wallpaper/MinimalCleanTemplate";
import GradientVibrantTemplate from "@/components/wallpaper/GradientVibrantTemplate";
import AuroraDarkTemplate from "@/components/wallpaper/AuroraDarkTemplate";

export interface TemplateProps {
  data: JadwalWallpaperData;
}

export interface TemplateDef {
  id: string;
  name: string;
  description: string;
  previewBg: string;
  component: ComponentType<TemplateProps & RefAttributes<HTMLDivElement>>;
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: "pastel-soft",
    name: "Pastel Soft",
    description: "Lembut, blob warna-warni, kartu melengkung",
    previewBg: "linear-gradient(135deg, #ffedd5, #f3e8ff, #d1fae5)",
    component: PastelSoftTemplate,
  },
  {
    id: "minimal-clean",
    name: "Minimalist Clean",
    description: "Rapi, tipografi tegas, banyak whitespace",
    previewBg: "linear-gradient(135deg, #f8fafc, #e2e8f0)",
    component: MinimalCleanTemplate,
  },
  {
    id: "gradient-vibrant",
    name: "Gradient Vibrant",
    description: "Bold, gradasi ungu-pink-oranye, kartu kaca mengambang",
    previewBg: "linear-gradient(135deg, #a855f7, #d946ef, #f97316)",
    component: GradientVibrantTemplate,
  },
  {
    id: "aurora-dark",
    name: "Aurora Dark",
    description: "Gelap elegan dengan efek aurora neon warna-warni",
    previewBg: "linear-gradient(135deg, #0a0a0f, #7c3aed, #06b6d4)",
    component: AuroraDarkTemplate,
  },
];