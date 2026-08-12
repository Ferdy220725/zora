"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import {
  ArrowLeft,
  GraduationCap,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Send,
  ShieldCheck,
  BadgeCheck,
  CalendarPlus,
  CalendarCheck,
  CheckSquare,
  Square,
  Loader2,
  AlertCircle,
  RotateCcw,
  FileQuestion,
} from 'lucide-react';
import {
  getScholarshipStatus,
  getStatusLabel,
  getStatusBadgeClass,
  getCountdownLabel,
  formatDeadlineDate,
} from '@/lib/scholarship-status';

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

interface ScholarshipDetail {
  id: string;
  name: string;
  provider_name: string;
  provider_logo_url: string | null;
  description: string | null;
  category: string;
  education_level: string[];
  application_start: string;
  application_deadline: string;
  application_deadline_time: string | null;
  amount: number | null;
  currency: string;
  region: string | null;
  official_source_url: string | null;
  registration_url: string | null;
  verification_status: 'official' | 'upn_verified' | 'verified_external' | 'unverified' | 'expired';
  last_verified_at: string | null;
  eligible_faculties: string[] | null;
  eligible_programs: string[] | null;
  min_ipk: number | null;
  min_semester: number | null;
  max_semester: number | null;
}

interface Requirement {
  id: string;
  requirement_type: string;
  requirement_label: string;
  requirement_value: string | null;
  is_required: boolean;
}

interface DocumentItem {
  id: string;
  document_label: string;
  sort_order: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  akademik: 'Akademik',
  ekonomi: 'Ekonomi',
  prestasi: 'Prestasi',
  organisasi: 'Organisasi',
  kepemimpinan: 'Kepemimpinan',
  riset: 'Riset',
  khusus_daerah: 'Khusus Daerah',
  lainnya: 'Lainnya',
};

function formatRupiah(amount: number, currency: string) {
  if (currency !== 'IDR') return `${amount.toLocaleString('id-ID')} ${currency}`;
  return `Rp${amount.toLocaleString('id-ID')}`;
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function BeasiswaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const supabase = createClient();

  const [scholarship, setScholarship] = useState<ScholarshipDetail | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [checklistDone, setChecklistDone] = useState<Set<string>>(new Set());
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    setNotFound(false);

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id ?? null;
    setUserId(uid);

    const [scholarshipRes, requirementsRes, documentsRes] = await Promise.all([
      supabase.from('scholarships').select('*').eq('id', id).eq('is_active', true).maybeSingle(),
      supabase
        .from('scholarship_requirements')
        .select('*')
        .eq('scholarship_id', id),
      supabase
        .from('scholarship_documents')
        .select('*')
        .eq('scholarship_id', id)
        .order('sort_order', { ascending: true }),
    ]);

    if (scholarshipRes.error) {
      console.error('Gagal memuat detail beasiswa:', scholarshipRes.error);
      setError(true);
      setLoading(false);
      return;
    }

    if (!scholarshipRes.data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setScholarship(scholarshipRes.data as ScholarshipDetail);
    setRequirements((requirementsRes.data ?? []) as Requirement[]);
    setDocuments((documentsRes.data ?? []) as DocumentItem[]);

    if (uid) {
      const [bookmarkRes, checklistRes, calendarRes] = await Promise.all([
        supabase
          .from('scholarship_bookmarks')
          .select('id')
          .eq('user_id', uid)
          .eq('scholarship_id', id)
          .maybeSingle(),
        supabase
          .from('scholarship_checklist_progress')
          .select('document_id, is_completed')
          .eq('user_id', uid)
          .eq('is_completed', true),
        supabase
          .from('scholarship_calendar_links')
          .select('id')
          .eq('user_id', uid)
          .eq('scholarship_id', id)
          .maybeSingle(),
      ]);

      setIsBookmarked(!!bookmarkRes.data);
      setChecklistDone(
        new Set((checklistRes.data ?? []).map((c: { document_id: string }) => c.document_id))
      );
      setCalendarAdded(!!calendarRes.data);
    }

    setLoading(false);
  };

  const toggleBookmark = async () => {
    if (!userId || !scholarship) return;
    const next = !isBookmarked;
    setIsBookmarked(next); // optimistic

    if (next) {
      const { error: insError } = await supabase
        .from('scholarship_bookmarks')
        .insert({ user_id: userId, scholarship_id: scholarship.id });
      if (insError) {
        console.error('Gagal simpan bookmark:', insError);
        setIsBookmarked(false);
      }
    } else {
      const { error: delError } = await supabase
        .from('scholarship_bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('scholarship_id', scholarship.id);
      if (delError) {
        console.error('Gagal hapus bookmark:', delError);
        setIsBookmarked(true);
      }
    }
  };

  const toggleChecklistItem = async (documentId: string) => {
    if (!userId) return;
    const isDone = checklistDone.has(documentId);
    const next = new Set(checklistDone);
    if (isDone) next.delete(documentId);
    else next.add(documentId);
    setChecklistDone(next); // optimistic

    const { error: upsertError } = await supabase
      .from('scholarship_checklist_progress')
      .upsert(
        {
          document_id: documentId,
          user_id: userId,
          is_completed: !isDone,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'document_id,user_id' }
      );

    if (upsertError) {
      console.error('Gagal update checklist:', upsertError);
      setChecklistDone(checklistDone); // rollback
    }
  };

  const addToCalendar = async () => {
    if (!userId || !scholarship || calendarAdded) return;
    setCalendarAdded(true); // optimistic

    // CATATAN: integrasi penuh ke tabel kalender akademik existing
    // menyusul setelah struktur tabelnya dikonfirmasi. Untuk sekarang,
    // kita catat intent-nya di scholarship_calendar_links (mencegah duplikat
    // lewat unique constraint) supaya begitu integrasi kalender jadi,
    // data historis "siapa yang mau nambahin apa" sudah tersedia.
    const { error: insError } = await supabase.from('scholarship_calendar_links').insert({
      user_id: userId,
      scholarship_id: scholarship.id,
    });

    if (insError) {
      console.error('Gagal menambahkan ke kalender:', insError);
      setCalendarAdded(false);
    }
  };

  // ------------------------------------------------------------
  // Loading / error / not found states
  // ------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7fb] dark:bg-[#0a0a0a]">
        <Loader2 className="animate-spin text-indigo-600" size={28} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7fb] dark:bg-[#0a0a0a] p-6">
        <div className="text-center space-y-3">
          <FileQuestion className="mx-auto text-slate-300" size={48} />
          <p className="text-slate-400 font-black uppercase italic tracking-widest">
            Beasiswa tidak ditemukan
          </p>
          <button
            onClick={() => router.push('/beasiswa')}
            className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all"
          >
            <ArrowLeft size={14} /> Kembali ke Daftar Beasiswa
          </button>
        </div>
      </div>
    );
  }

  if (error || !scholarship) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7fb] dark:bg-[#0a0a0a] p-6">
        <div className="text-center space-y-3">
          <AlertCircle className="mx-auto text-rose-400" size={40} />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            Gagal memuat detail beasiswa.
          </p>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all"
          >
            <RotateCcw size={14} /> Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const status = getScholarshipStatus(scholarship);
  const countdown = getCountdownLabel(scholarship);
  const checklistProgress =
    documents.length > 0 ? Math.round((checklistDone.size / documents.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#f7f7fb] dark:bg-[#0a0a0a] font-sans">
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">

        {/* BACK */}
        <button
          onClick={() => router.push('/beasiswa')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-all"
        >
          <ArrowLeft size={14} /> Kembali
        </button>

        {/* HEADER CARD */}
        <div className="bg-white dark:bg-[#141414] rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-white/10 space-y-4">
          <div className="flex items-start gap-3">
            {scholarship.provider_logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={scholarship.provider_logo_url}
                alt={scholarship.provider_name}
                className="w-12 h-12 rounded-2xl object-cover shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0">
                <GraduationCap size={20} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-400">{scholarship.provider_name}</p>
              <h1 className="font-black text-slate-900 dark:text-white text-lg leading-snug">
                {scholarship.name}
              </h1>
            </div>
            <button
              onClick={toggleBookmark}
              disabled={!userId}
              aria-label={isBookmarked ? 'Hapus dari tersimpan' : 'Simpan beasiswa'}
              className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                isBookmarked
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                  : 'bg-slate-50 text-slate-400 dark:bg-white/5 dark:text-slate-500 hover:text-indigo-500'
              } disabled:opacity-40`}
            >
              {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            </button>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg ${getStatusBadgeClass(status)}`}
            >
              {getStatusLabel(status)}
            </span>
            <VerificationBadge status={scholarship.verification_status} />
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-500 dark:bg-white/5 dark:text-slate-400">
              {CATEGORY_LABELS[scholarship.category] ?? scholarship.category}
            </span>
          </div>

          {scholarship.last_verified_at && (
            <p className="text-[11px] text-slate-400 font-medium">
              Terakhir diverifikasi:{' '}
              {new Date(scholarship.last_verified_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'Asia/Jakarta',
              })}
            </p>
          )}

          {/* Key facts grid */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-50 dark:border-white/5">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Deadline</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {formatDeadlineDate(scholarship.application_deadline)}
              </p>
              {countdown && (
                <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {countdown}
                </p>
              )}
            </div>
            {scholarship.amount != null && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Nominal</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {formatRupiah(scholarship.amount, scholarship.currency)}
                </p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Jenjang</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {scholarship.education_level.join(', ')}
              </p>
            </div>
            {scholarship.region && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Wilayah</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {scholarship.region}
                </p>
              </div>
            )}
          </div>

          {/* CTA links */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {scholarship.official_source_url && (
              <a
                href={scholarship.official_source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-200 text-xs font-bold px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
              >
                <ExternalLink size={14} /> Sumber Resmi
              </a>
            )}
            {scholarship.registration_url && status !== 'tutup' && (
              <a
                href={scholarship.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white text-xs font-bold px-4 py-3 rounded-xl hover:bg-indigo-700 transition-all"
              >
                <Send size={14} /> Daftar Sekarang
              </a>
            )}
          </div>

          {/* Calendar */}
          {userId && (
            <button
              onClick={addToCalendar}
              disabled={calendarAdded}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-all disabled:opacity-60"
            >
              {calendarAdded ? (
                <>
                  <CalendarCheck size={14} className="text-emerald-500" /> Sudah ditambahkan ke rencana kalender
                </>
              ) : (
                <>
                  <CalendarPlus size={14} /> Tambahkan deadline ke Kalender Zora
                </>
              )}
            </button>
          )}
        </div>

        {/* DESCRIPTION */}
        {scholarship.description && (
          <div className="bg-white dark:bg-[#141414] rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-white/10">
            <h2 className="font-black text-slate-900 dark:text-white text-sm mb-2">
              Tentang Beasiswa
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {scholarship.description}
            </p>
          </div>
        )}

        {/* REQUIREMENTS */}
        <RequirementsSection scholarship={scholarship} requirements={requirements} />

        {/* CHECKLIST */}
        {documents.length > 0 && (
          <div className="bg-white dark:bg-[#141414] rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-white/10 space-y-4">
            <div>
              <h2 className="font-black text-slate-900 dark:text-white text-sm mb-1">
                📋 Persiapan Pendaftaran
              </h2>
              {userId ? (
                <p className="text-xs font-bold text-slate-400">
                  {checklistDone.size}/{documents.length} dokumen siap · Progress {checklistProgress}%
                </p>
              ) : (
                <p className="text-xs font-medium text-slate-400">
                  Masuk untuk melacak progress checklist dokumenmu.
                </p>
              )}
            </div>

            {userId && (
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all"
                  style={{ width: `${checklistProgress}%` }}
                />
              </div>
            )}

            <div className="space-y-2">
              {documents.map((doc) => {
                const done = checklistDone.has(doc.id);
                return (
                  <button
                    key={doc.id}
                    onClick={() => toggleChecklistItem(doc.id)}
                    disabled={!userId}
                    className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all disabled:hover:bg-transparent"
                  >
                    {done ? (
                      <CheckSquare size={18} className="text-indigo-600 shrink-0" />
                    ) : (
                      <Square size={18} className="text-slate-300 shrink-0" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        done
                          ? 'text-slate-400 line-through decoration-slate-300'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {doc.document_label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Requirements section — hanya tampilkan yang terisi
// ------------------------------------------------------------

function RequirementsSection({
  scholarship,
  requirements,
}: {
  scholarship: ScholarshipDetail;
  requirements: Requirement[];
}) {
  const structuredRows: { label: string; value: string }[] = [];

  if (scholarship.min_ipk != null) {
    structuredRows.push({ label: 'IPK Minimum', value: scholarship.min_ipk.toFixed(2) });
  }
  if (scholarship.min_semester != null || scholarship.max_semester != null) {
    const parts = [];
    if (scholarship.min_semester != null) parts.push(`min. semester ${scholarship.min_semester}`);
    if (scholarship.max_semester != null) parts.push(`maks. semester ${scholarship.max_semester}`);
    structuredRows.push({ label: 'Semester', value: parts.join(', ') });
  }
  if (scholarship.eligible_faculties?.length) {
    structuredRows.push({ label: 'Fakultas', value: scholarship.eligible_faculties.join(', ') });
  }
  if (scholarship.eligible_programs?.length) {
    structuredRows.push({ label: 'Program Studi', value: scholarship.eligible_programs.join(', ') });
  }

  const hasNothing = structuredRows.length === 0 && requirements.length === 0;
  if (hasNothing) return null;

  return (
    <div className="bg-white dark:bg-[#141414] rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-white/10 space-y-3">
      <h2 className="font-black text-slate-900 dark:text-white text-sm mb-1">Persyaratan</h2>

      {structuredRows.map((row) => (
        <div key={row.label} className="flex items-start justify-between gap-4 text-sm">
          <span className="font-bold text-slate-400 shrink-0">{row.label}</span>
          <span className="text-slate-700 dark:text-slate-200 text-right">{row.value}</span>
        </div>
      ))}

      {requirements.length > 0 && (
        <div className="pt-2 border-t border-slate-50 dark:border-white/5 space-y-2">
          {requirements.map((req) => (
            <div key={req.id} className="flex items-start justify-between gap-4 text-sm">
              <span className="font-bold text-slate-400 shrink-0">
                {req.requirement_label}
                {req.is_required ? '' : ' (opsional)'}
              </span>
              {req.requirement_value && (
                <span className="text-slate-700 dark:text-slate-200 text-right">
                  {req.requirement_value}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VerificationBadge({ status }: { status: ScholarshipDetail['verification_status'] }) {
  if (status === 'upn_verified') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
        <ShieldCheck size={11} /> UPN Verified
      </span>
    );
  }
  if (status === 'official') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
        <BadgeCheck size={11} /> Official Source
      </span>
    );
  }
  if (status === 'verified_external') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
        <BadgeCheck size={11} /> Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
      Unverified
    </span>
  );
}