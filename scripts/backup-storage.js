// ============================================================
// SCRIPT BACKUP SUPABASE STORAGE
// Membaca kredensial dari .env.local — pastikan file itu punya:
//   NEXT_PUBLIC_SUPABASE_URL=...
//   SUPABASE_SERVICE_ROLE_KEY=...
//
// Cara pakai:
// 1. npm install @supabase/supabase-js dotenv
// 2. node scripts/backup-storage.js
// 3. Semua file akan ke-download ke folder ./storage-backup
// ============================================================

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL atau SERVICE_ROLE_KEY tidak ditemukan di .env.local');
  process.exit(1);
}

// Nama bucket yang mau di-backup (tambahin di sini kalau ada bucket lain)
const BUCKETS_TO_BACKUP = ['uploads'];

const OUTPUT_DIR = path.join(__dirname, '..', 'storage-backup');

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

async function downloadFile(bucket, filePath) {
  const { data, error } = await supabase.storage.from(bucket).download(filePath);
  if (error) {
    console.error(`  Gagal download "${filePath}":`, error.message);
    return;
  }

  const localPath = path.join(OUTPUT_DIR, bucket, filePath);
  fs.mkdirSync(path.dirname(localPath), { recursive: true });

  const buffer = Buffer.from(await data.arrayBuffer());
  fs.writeFileSync(localPath, buffer);
  console.log(`  ✓ ${filePath}`);
}

async function main() {
  console.log('Mulai backup storage...\n');

  for (const bucket of BUCKETS_TO_BACKUP) {
    console.log(`Bucket: ${bucket}`);
    const files = await listAllFiles(bucket);
    console.log(`  Ditemukan ${files.length} file. Mulai download...\n`);

    for (const filePath of files) {
      await downloadFile(bucket, filePath);
    }
  }

  console.log(`\nSelesai! Semua file ada di folder: ${OUTPUT_DIR}`);
  console.log('Tinggal copy folder ini ke flashdisk kamu.');
}

main();