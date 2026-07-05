import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFParse } from "pdf-parse";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Batas panjang teks yang disimpan (biar nggak kebesaran pas nanti dikirim ke AI)
const MAX_LEN = 15000;

export async function POST(req: NextRequest) {
  try {
    const { materiId, fileUrl } = await req.json();

    if (!materiId || !fileUrl) {
      return NextResponse.json({ error: "materiId dan fileUrl wajib diisi" }, { status: 400 });
    }

    // 1. Download file PDF dari Supabase Storage (pakai public URL yang sudah ada)
    const pdfRes = await fetch(fileUrl);
    if (!pdfRes.ok) {
      return NextResponse.json({ error: "Gagal mengambil file PDF dari storage" }, { status: 400 });
    }
    const arrayBuffer = await pdfRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Ekstrak teks dari PDF (API v2: class-based, bukan function langsung)
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    let teks = parsed.text.trim();

    if (!teks) {
      // PDF kemungkinan hasil scan/gambar, bukan teks asli — pdf-parse tidak melakukan OCR
      return NextResponse.json({
        ok: false,
        warning: "Tidak ada teks yang bisa diekstrak. Kemungkinan PDF ini hasil scan/gambar, bukan teks asli.",
      });
    }

    // 3. Potong kalau kepanjangan
    if (teks.length > MAX_LEN) {
      teks = teks.slice(0, MAX_LEN) + "\n\n[...teks dipotong karena terlalu panjang...]";
    }

    // 4. Simpan ke kolom konten_teks
    const { error } = await supabase
      .from("materi")
      .update({ konten_teks: teks })
      .eq("id", materiId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, panjang: teks.length });
  } catch (err: any) {
    console.error("[Extract Materi Error]", err);
    return NextResponse.json({ error: err.message || "Gagal ekstraksi teks" }, { status: 500 });
  }
}