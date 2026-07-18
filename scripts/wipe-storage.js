// ============================================================
// SCRIPT KOSONGKAN ISI BUCKET SUPABASE STORAGE
// ⚠️ HATI-HATI: ini menghapus SEMUA file di bucket yang disebut,
// bukan cuma yang lama. Pastikan sudah backup dulu (storage-backup/)
// sebelum jalankan script ini!
//
// Membaca kredensial dari .env.local, sama seperti backup-storage.js
//
// Cara pakai:
// 1. Pastikan sudah pernah jalanin backup-storage.js dan hasilnya oke
// 2. node scripts/wipe-storage.js
// ============================================================

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL atau SERVICE_ROLE_KEY tidak ditemukan di .env.local');
  process.exit(1);
}

// Bucket yang mau dikosongkan
const BUCKETS_TO_WIPE = ['uploads'];

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function listAllFiles(bucket, prefix = '') {
  let allFiles = [];
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error) {
    console.error(`Gagal list folder "${prefix}" di bucket "${bucket}":`, error.message);
    return allFiles;
  }

  for (const item of data) {
    const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) {
      const nested = await listAllFiles(bucket, itemPath);
      allFiles = allFiles.concat(nested);
    } else {
      allFiles.push(itemPath);
    }
  }

  return allFiles;
}

function askConfirmation(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toUpperCase());
    });
  });
}

async function main() {
  console.log('=== WIPE SUPABASE STORAGE ===\n');

  let totalFiles = 0;
  const fileMap = {};

  for (const bucket of BUCKETS_TO_WIPE) {
    const files = await listAllFiles(bucket);
    fileMap[bucket] = files;
    totalFiles += files.length;
    console.log(`Bucket "${bucket}": ${files.length} file ditemukan.`);
  }

  if (totalFiles === 0) {
    console.log('\nTidak ada file untuk dihapus.');
    return;
  }

  console.log(`\nTOTAL: ${totalFiles} file akan DIHAPUS PERMANEN dari bucket: ${BUCKETS_TO_WIPE.join(', ')}`);
  const jawaban = await askConfirmation('\nKetik "HAPUS" (huruf besar) untuk lanjut, atau Enter untuk batal: ');

  if (jawaban !== 'HAPUS') {
    console.log('Dibatalkan. Tidak ada yang dihapus.');
    return;
  }

  for (const bucket of BUCKETS_TO_WIPE) {
    const files = fileMap[bucket];
    console.log(`\nMenghapus ${files.length} file dari bucket "${bucket}"...`);

    // Hapus per batch 100 file biar gak kena limit request
    const BATCH_SIZE = 100;
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.storage.from(bucket).remove(batch);
      if (error) {
        console.error(`  Gagal hapus batch ${i}-${i + batch.length}:`, error.message);
      } else {
        console.log(`  ✓ Terhapus ${i + batch.length}/${files.length}`);
      }
    }
  }

  console.log('\nSelesai! Bucket sudah kosong.');
}

main();