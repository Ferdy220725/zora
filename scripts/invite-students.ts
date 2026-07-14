import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local!");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

const students = [
  { npm: "25025010094", nama: "AGNIA LAQUINTA AL-ABIN" },
].map((s: any) => ({
  ...s,
  email: s.email || `${s.npm}@student.upnjatim.ac.id`,
}));

// ── Helper: cari user yang sudah ada berdasarkan email ────────────────────
async function findExistingUser(email: string) {
  // listUsers di-paginate, untuk kelas ukuran wajar ambil per 1000 cukup
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) return null;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < perPage) return null; // sudah halaman terakhir
    page++;
  }
}

async function inviteAllStudents() {
  console.log(`🚀 Memulai proses pengiriman undangan untuk ${students.length} mahasiswa...\n`);

  for (const s of students) {
    try {
      // 1. Cek apakah user dengan email ini sudah pernah dibuat sebelumnya
      const existing = await findExistingUser(s.email);

      if (existing) {
        // Hapus dulu supaya bisa di-invite ulang dari nol (fresh, bukan resend link lama)
        const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(existing.id);
        if (delError) {
          console.error(`⚠️  Gagal hapus user lama ${s.email}: ${delError.message} — tetap coba invite ulang...`);
        } else {
          console.log(`🗑️  User lama ${s.email} dihapus, akan diundang ulang dari nol.`);
        }
      }

      // 2. Kirim undangan baru (fresh)
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

    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("\n✨ Selesai! Semua mahasiswa telah diproses. Cek log di atas untuk yang gagal (jika ada).");
}

inviteAllStudents();