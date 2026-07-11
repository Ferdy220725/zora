import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Memuat environment variables dari file .env.local
config({ path: ".env.local" });

// Pastikan variabel ini ada di .env.local kamu
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local!");
  process.exit(1);
}

// Admin client menggunakan service_role key
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// Daftar mahasiswa yang akan diundang.
// Kalau mau pakai email custom (misal Gmail buat testing), tinggal tambahin field "email" manual.
// Kalau field "email" tidak diisi, otomatis pakai format email kampus dari NPM.
const students = [
  { npm: "25025010100", nama: "AHMAT CHOYRUL FERDYANSYAH", email: "ahmatchoyrulferdyasnyah22@gmail.com" }, // contoh pakai email custom buat testing
  // { npm: "25025010128", nama: "FARINA PUTRI AURELIA" }, // contoh tanpa email custom -> otomatis pakai email kampus
].map((s: any) => ({
  ...s,
  email: s.email || `${s.npm}@student.upnjatim.ac.id`,
}));

async function inviteAllStudents() {
  console.log(`🚀 Memulai proses pengiriman undangan untuk ${students.length} mahasiswa...\n`);

  for (const s of students) {
    try {
      const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(s.email, {
        data: {
          nama: s.nama,
          npm: s.npm,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/set-password`,
      });

      if (error) {
        console.error(`❌ Gagal mengundang ${s.email} (${s.nama}): ${error.message}`);
      } else {
        console.log(`✅ Undangan berhasil terkirim ke: ${s.email} (${s.nama})`);
      }
    } catch (err: any) {
      console.error(`❌ Terjadi error pada sistem saat mengundang ${s.email}:`, err.message);
    }

    // Delay 2 detik antar kirim untuk menghindari rate-limit dari penyedia email
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("\n✨ Selesai! Semua mahasiswa telah diproses. Cek log di atas untuk yang gagal (jika ada).");
}

inviteAllStudents();