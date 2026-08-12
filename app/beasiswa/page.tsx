"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import {
  GraduationCap,
  Search,
  SlidersHorizontal,
  Bookmark,
  BookmarkCheck,
  Loader2,
  PackageOpen,
  SearchX,
  BadgeCheck,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import {
  getScholarshipStatus,
  getStatusLabel,
  getStatusBadgeClass,
  getCountdownLabel,
  formatDeadlineDate,
  type ScholarshipStatus,
} from '@/lib/scholarship-status';

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

interface Scholarship {
  id: string;
  name: string;
  provider_name: string;
  provider_logo_url: string | null;
  category: string;
  education_level: string[];
  application_start: string;
  application_deadline: string;
  application_deadline_time: string | null;
  amount: number | null;
  currency: string;
  min_ipk: number | null;
  min_semester: number | null;
  max_semester: number | null;
  verification_status: 'official' | 'upn_verified' | 'verified_external' | 'unverified' | 'expired';
  is_active: boolean;
}

type FilterStatus = 'semua' | 'buka' | 'segera_buka' | 'tersimpan';

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

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function BeasiswaPage() {
  const [items, setItems] = useState<Scholarship[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('semua');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(false);

    const [scholarshipRes, bookmarkRes] = await Promise.all([
      supabase
        .from('scholarships')
        .select('*')
        .eq('is_active', true)
        .order('application_deadline', { ascending: true }),
      supabase.auth.getUser().then(async ({ data: userData }) => {
        if (!userData.user) return { data: [] };
        return supabase
          .from('scholarship_bookmarks')
          .select('scholarship_id')
          .eq('user_id', userData.user.id);
      }),
    ]);

    if (scholarshipRes.error) {
      console.error('Gagal memuat beasiswa:', scholarshipRes.error);
      setError(true);
      setLoading(false);
      return;
    }

    setItems((scholarshipRes.data ?? []) as Scholarship[]);
    setBookmarkedIds(
      new Set((bookmarkRes.data ?? []).map((b: { scholarship_id: string }) => b.scholarship_id))
    );
    setLoading(false);
  };

  const toggleBookmark = async (scholarshipId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const isBookmarked = bookmarkedIds.has(scholarshipId);
    const next = new Set(bookmarkedIds);

    // Optimistic update
    if (isBookmarked) {
      next.delete(scholarshipId);
    } else {
      next.add(scholarshipId);
    }
    setBookmarkedIds(next);

    if (isBookmarked) {
      const { error: delError } = await supabase
        .from('scholarship_bookmarks')
        .delete()
        .eq('user_id', userData.user.id)
        .eq('scholarship_id', scholarshipId);
      if (delError) {
        console.error('Gagal hapus bookmark:', delError);
        setBookmarkedIds(bookmarkedIds); // rollback
      }
    } else {
      const { error: insError } = await supabase
        .from('scholarship_bookmarks')
        .insert({ user_id: userData.user.id, scholarship_id: scholarshipId });
      if (insError) {
        console.error('Gagal simpan bookmark:', insError);
        setBookmarkedIds(bookmarkedIds); // rollback
      }
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const status = getScholarshipStatus(item);

      // Filter status/tab
      if (filterStatus === 'buka' && status !== 'buka') return false;
      if (filterStatus === 'segera_buka' && status !== 'segera_buka') return false;
      if (filterStatus === 'tersimpan' && !bookmarkedIds.has(item.id)) return false;

      // Filter kategori
      if (selectedCategory && item.category !== selectedCategory) return false;

      // Filter jenjang
      if (selectedLevel && !item.education_level.includes(selectedLevel)) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const haystack = `${item.name} ${item.provider_name} ${CATEGORY_LABELS[item.category] ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [items, filterStatus, selectedCategory, selectedLevel, searchQuery, bookmarkedIds]);

  const activeFilterCount = [selectedCategory, selectedLevel].filter(Boolean).length;

  // ------------------------------------------------------------
  // Loading state
  // ------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7fb] dark:bg-[#0a0a0a]">
        <Loader2 className="animate-spin text-indigo-600" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7fb] dark:bg-[#0a0a0a] font-sans">
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
            <GraduationCap size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Beasiswa</h1>
            <p className="text-xs text-slate-400 font-medium">
              Temukan peluang beasiswa yang sesuai untukmu
            </p>
          </div>
        </div>

        {/* SEARCH + FILTER TRIGGER */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama beasiswa, penyelenggara..."
              className="w-full bg-white dark:bg-[#141414] border border-slate-100 dark:border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
          <button
            onClick={() => setShowFilterSheet(true)}
            className="relative shrink-0 w-11 h-11 rounded-2xl bg-white dark:bg-[#141414] border border-slate-100 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
            aria-label="Buka filter"
          >
            <SlidersHorizontal size={18} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* STATUS TABS */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
          {(
            [
              { key: 'semua', label: 'Semua' },
              { key: 'buka', label: 'Sedang Dibuka' },
              { key: 'segera_buka', label: 'Segera Dibuka' },
              { key: 'tersimpan', label: 'Tersimpan' },
            ] as { key: FilterStatus; label: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterStatus === tab.key
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-white dark:bg-[#141414] text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="bg-white dark:bg-[#141414] rounded-[24px] p-8 text-center shadow-sm border border-rose-100 dark:border-rose-500/20 space-y-3">
            <AlertCircle className="mx-auto text-rose-400" size={36} />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              Gagal memuat data beasiswa.
            </p>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all"
            >
              <RotateCcw size={14} /> Coba Lagi
            </button>
          </div>
        )}

        {/* LIST */}
        {!error && filteredItems.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredItems.map((item) => (
              <ScholarshipCard
                key={item.id}
                item={item}
                isBookmarked={bookmarkedIds.has(item.id)}
                onToggleBookmark={() => toggleBookmark(item.id)}
              />
            ))}
          </div>
        )}

        {/* EMPTY STATES */}
        {!error && !loading && filteredItems.length === 0 && (
          <div className="bg-white dark:bg-[#141414] rounded-[28px] py-20 text-center shadow-sm border border-slate-100 dark:border-white/10">
            {searchQuery.trim() || activeFilterCount > 0 || filterStatus !== 'semua' ? (
              <>
                <SearchX className="mx-auto text-slate-300 mb-3" size={48} />
                <p className="text-slate-300 font-black uppercase italic text-lg tracking-widest">
                  {filterStatus === 'tersimpan'
                    ? 'Belum ada beasiswa tersimpan'
                    : 'Beasiswa tidak ditemukan'}
                </p>
              </>
            ) : (
              <>
                <PackageOpen className="mx-auto text-slate-300 mb-3" size={48} />
                <p className="text-slate-300 font-black uppercase italic text-lg tracking-widest">
                  Belum ada beasiswa tersedia
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* FILTER BOTTOM SHEET (mobile) */}
      {showFilterSheet && (
        <FilterSheet
          selectedCategory={selectedCategory}
          selectedLevel={selectedLevel}
          onSelectCategory={setSelectedCategory}
          onSelectLevel={setSelectedLevel}
          onClose={() => setShowFilterSheet(false)}
          onReset={() => {
            setSelectedCategory(null);
            setSelectedLevel(null);
          }}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Scholarship Card
// ------------------------------------------------------------

function ScholarshipCard({
  item,
  isBookmarked,
  onToggleBookmark,
}: {
  item: Scholarship;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}) {
  const status = getScholarshipStatus(item);
  const countdown = getCountdownLabel(item);

  return (
    <div className="bg-white dark:bg-[#141414] rounded-[24px] p-5 shadow-sm border border-slate-100 dark:border-white/10 flex flex-col">
      {/* Provider */}
      <div className="flex items-center gap-2 mb-3">
        {item.provider_logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.provider_logo_url}
            alt={item.provider_name}
            className="w-7 h-7 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400 text-xs font-black shrink-0">
            {item.provider_name.charAt(0)}
          </div>
        )}
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
          {item.provider_name}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-black text-slate-900 dark:text-white text-sm leading-snug mb-3">
        {item.name}
      </h3>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-lg ${getStatusBadgeClass(status)}`}
        >
          {getStatusLabel(status)}
        </span>
        <VerificationBadge status={item.verification_status} />
      </div>

      {/* Requirements summary */}
      <p className="text-[11px] font-bold text-slate-400 mb-3">
        {item.education_level.join(', ')}
        {item.min_ipk ? ` · IPK ≥ ${item.min_ipk.toFixed(2)}` : ''}
      </p>

      {/* Deadline */}
      <div className="mt-auto pt-3 border-t border-slate-50 dark:border-white/5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Deadline</p>
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {formatDeadlineDate(item.application_deadline)}
        </p>
        {countdown && (
          <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {countdown}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4">
        <Link
          href={`/beasiswa/${item.id}`}
          className="flex-1 text-center bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all"
        >
          Lihat Detail
        </Link>
        <button
          onClick={onToggleBookmark}
          aria-label={isBookmarked ? 'Hapus dari tersimpan' : 'Simpan beasiswa'}
          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            isBookmarked
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
              : 'bg-slate-50 text-slate-400 dark:bg-white/5 dark:text-slate-500 hover:text-indigo-500'
          }`}
        >
          {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </button>
      </div>
    </div>
  );
}

function VerificationBadge({ status }: { status: Scholarship['verification_status'] }) {
  if (status === 'upn_verified') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
        <ShieldCheck size={11} /> UPN Verified
      </span>
    );
  }
  if (status === 'official') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
        <BadgeCheck size={11} /> Official Source
      </span>
    );
  }
  if (status === 'verified_external') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
        <BadgeCheck size={11} /> Verified
      </span>
    );
  }
  // unverified / expired -> tampilkan apa adanya, jangan klaim
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
      Unverified
    </span>
  );
}

// ------------------------------------------------------------
// Filter Bottom Sheet
// ------------------------------------------------------------

const CATEGORIES = Object.entries(CATEGORY_LABELS);
const LEVELS = ['D3', 'D4', 'S1', 'S2'];

function FilterSheet({
  selectedCategory,
  selectedLevel,
  onSelectCategory,
  onSelectLevel,
  onClose,
  onReset,
}: {
  selectedCategory: string | null;
  selectedLevel: string | null;
  onSelectCategory: (v: string | null) => void;
  onSelectLevel: (v: string | null) => void;
  onClose: () => void;
  onReset: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="relative w-full md:max-w-md bg-white dark:bg-[#141414] rounded-t-[28px] md:rounded-[28px] p-6 space-y-5 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-slate-900 dark:text-white text-base">Filter</h2>
          <button
            onClick={onReset}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400"
          >
            Reset
          </button>
        </div>

        <div>
          <p className="text-xs font-black uppercase text-slate-400 mb-2">Jenjang</p>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => onSelectLevel(selectedLevel === level ? null : level)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedLevel === level
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-black uppercase text-slate-400 mb-2">Kategori</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(([key, label]) => (
              <button
                key={key}
                onClick={() => onSelectCategory(selectedCategory === key ? null : key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-indigo-600 text-white text-sm font-bold py-3 rounded-2xl hover:bg-indigo-700 transition-all"
        >
          Terapkan Filter
        </button>
      </div>
    </div>
  );
}