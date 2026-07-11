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

// Daftar mahasiswa yang akan diundang
const students = [
  { npm: "25025010100", nama: "AHMAT CHOYRUL FERDYANSYAH" },
  // Tambahkan list mahasiswa lainnya di sini
].map((s) => ({
  ...s,
  email: `${s.npm}@student.upnjatim.ac.id`,
}));

async function inviteAllStudents() {
  console.log(`🚀 Memulai proses pengiriman undangan untuk ${students.length} mahasiswa...\n`);

  for (const s of students) {
    try {
      // Mengirim undangan
      const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(s.email, {
        data: { 
          nama: s.nama, 
          npm: s.npm 
        },
        // WAJIB: Arahkan ke callback agar sesi tersimpan di browser
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      });

      if (error) {
        console.error(`❌ Gagal mengundang ${s.email}: ${error.message}`);
      } else {
        console.log(`✅ Undangan berhasil terkirim ke: ${s.email}`);
      }
    } catch (err: any) {
      console.error(`❌ Terjadi error pada sistem saat mengundang ${s.email}:`, err.message);
    }

    // Delay 2 detik untuk menghindari rate-limit (pembatasan) dari penyedia email
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("\n✨ Selesai! Semua mahasiswa telah diproses.");
}

inviteAllStudents();