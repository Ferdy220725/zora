// lib/scholarship-status.ts
//
// Semua perhitungan status & countdown beasiswa HARUS lewat file ini,
// supaya konsisten di listing page, detail page, dan card.
// Timezone dikunci ke Asia/Jakarta (WIB) — jangan pakai new Date() polos
// karena bisa beda hasil tergantung timezone browser user.

export type ScholarshipStatus = 'buka' | 'segera_buka' | 'tutup';

interface DeadlineInput {
  application_start: string; // 'YYYY-MM-DD'
  application_deadline: string; // 'YYYY-MM-DD'
  application_deadline_time?: string | null; // 'HH:mm:ss', opsional
}

/**
 * Deadline & tanggal buka disimpan sebagai `date` (tanpa timezone) di Supabase.
 * Kita anggap tanggal tersebut adalah wall-clock WIB (+07:00), lalu bandingkan
 * langsung dengan `new Date()` — perbandingan Date object di JS selalu absolut
 * (berbasis UTC internal), jadi ini aman terlepas dari timezone browser user.
 */
function parseDeadlineWIB(input: DeadlineInput): Date {
  const time = input.application_deadline_time ?? '23:59:59';
  return new Date(`${input.application_deadline}T${time}+07:00`);
}

function parseStartWIB(startDate: string): Date {
  return new Date(`${startDate}T00:00:00+07:00`);
}

export function getScholarshipStatus(input: DeadlineInput): ScholarshipStatus {
  const now = new Date(); // Date object absolut, aman dibandingkan dgn Date ber-offset eksplisit
  const start = parseStartWIB(input.application_start);
  const deadline = parseDeadlineWIB(input);

  if (now < start) return 'segera_buka';
  if (now > deadline) return 'tutup';
  return 'buka';
}

export function getStatusLabel(status: ScholarshipStatus): string {
  switch (status) {
    case 'buka':
      return '🟢 Sedang Dibuka';
    case 'segera_buka':
      return '🟡 Segera Dibuka';
    case 'tutup':
      return '🔴 Ditutup';
  }
}

export function getStatusBadgeClass(status: ScholarshipStatus): string {
  switch (status) {
    case 'buka':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
    case 'segera_buka':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
    case 'tutup':
      return 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400';
  }
}

/**
 * Countdown label yang ramah baca: "⏰ 13 hari lagi", "⚠️ Besok terakhir",
 * "🔴 Ditutup hari ini", "🔴 Pendaftaran ditutup"
 */
export function getCountdownLabel(input: DeadlineInput): string {
  const status = getScholarshipStatus(input);
  if (status === 'segera_buka') return '';
  if (status === 'tutup') return '🔴 Pendaftaran ditutup';

  const now = new Date();
  const deadline = parseDeadlineWIB(input);
  const diffMs = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return '🔴 Ditutup hari ini';
  if (diffDays === 1) return '⚠️ Besok terakhir';
  return `⏰ ${diffDays} hari lagi`;
}

export function formatDeadlineDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00+07:00`);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
}