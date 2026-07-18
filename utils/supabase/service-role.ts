import { createClient } from '@supabase/supabase-js';

// PENTING: file ini HANYA boleh dipakai di kode server-side
// (API routes / Server Actions), JANGAN PERNAH diimport dari
// komponen "use client". Service Role Key ini melewati semua
// RLS, jadi kalau bocor ke browser sama saja bikin pintu belakang
// buat siapa saja mengubah data apa saja.
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum di-set di environment variables.'
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}