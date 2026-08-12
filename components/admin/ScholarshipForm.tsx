"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Save,
  AlertCircle,
} from 'lucide-react';

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

const EDUCATION_LEVELS = ['D3', 'D4', 'S1', 'S2'] as const;
const CATEGORIES = [
  { value: 'akademik', label: 'Akademik' },
  { value: 'ekonomi', label: 'Ekonomi' },
  { value: 'prestasi', label: 'Prestasi' },
  { value: 'organisasi', label: 'Organisasi' },
  { value: 'kepemimpinan', label: 'Kepemimpinan' },
  { value: 'riset', label: 'Riset' },
  { value: 'khusus_daerah', label: 'Khusus Daerah' },
  { value: 'lainnya', label: 'Lainnya' },
];
const VERIFICATION_OPTIONS = [
  { value: 'unverified', label: 'Unverified' },
  { value: 'verified_external', label: 'Verified (Eksternal)' },
  { value: 'official', label: 'Official Source' },
  { value: 'upn_verified', label: 'UPN Verified' },
];

interface RequirementRow {
  id?: string; // ada isinya kalau row lama dari DB
  requirement_type: string;
  requirement_label: string;
  requirement_value: string;
  is_required: boolean;
}

interface DocumentRow {
  id?: string;
  document_label: string;
}

interface FormState {
  name: string;
  provider_name: string;
  provider_logo_url: string;
  description: string;
  category: string;
  education_level: string[];
  application_start: string;
  application_deadline: string;
  application_deadline_time: string;
  amount: string;
  currency: string;
  region: string;
  official_source_url: string;
  registration_url: string;
  verification_status: string;
  eligible_faculties: string; // input as comma-separated, split saat submit
  eligible_programs: string;
  min_ipk: string;
  min_semester: string;
  max_semester: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  provider_name: '',
  provider_logo_url: '',
  description: '',
  category: 'lainnya',
  education_level: [],
  application_start: '',
  application_deadline: '',
  application_deadline_time: '',
  amount: '',
  currency: 'IDR',
  region: '',
  official_source_url: '',
  registration_url: '',
  verification_status: 'unverified',
  eligible_faculties: '',
  eligible_programs: '',
  min_ipk: '',
  min_semester: '',
  max_semester: '',
};

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function ScholarshipForm({ scholarshipId }: { scholarshipId?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const isEditMode = !!scholarshipId;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [requirements, setRequirements] = useState<RequirementRow[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [deletedRequirementIds, setDeletedRequirementIds] = useState<string[]>([]);
  const [deletedDocumentIds, setDeletedDocumentIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode) loadExisting();
  }, [scholarshipId]);

  const loadExisting = async () => {
    setLoading(true);
    const [scholarshipRes, requirementsRes, documentsRes] = await Promise.all([
      supabase.from('scholarships').select('*').eq('id', scholarshipId).single(),
      supabase.from('scholarship_requirements').select('*').eq('scholarship_id', scholarshipId),
      supabase
        .from('scholarship_documents')
        .select('*')
        .eq('scholarship_id', scholarshipId)
        .order('sort_order', { ascending: true }),
    ]);

    if (scholarshipRes.error || !scholarshipRes.data) {
      setErrorMsg('Gagal memuat data beasiswa.');
      setLoading(false);
      return;
    }

    const s = scholarshipRes.data;
    setForm({
      name: s.name ?? '',
      provider_name: s.provider_name ?? '',
      provider_logo_url: s.provider_logo_url ?? '',
      description: s.description ?? '',
      category: s.category ?? 'lainnya',
      education_level: s.education_level ?? [],
      application_start: s.application_start ?? '',
      application_deadline: s.application_deadline ?? '',
      application_deadline_time: s.application_deadline_time ?? '',
      amount: s.amount != null ? String(s.amount) : '',
      currency: s.currency ?? 'IDR',
      region: s.region ?? '',
      official_source_url: s.official_source_url ?? '',
      registration_url: s.registration_url ?? '',
      verification_status: s.verification_status ?? 'unverified',
      eligible_faculties: (s.eligible_faculties ?? []).join(', '),
      eligible_programs: (s.eligible_programs ?? []).join(', '),
      min_ipk: s.min_ipk != null ? String(s.min_ipk) : '',
      min_semester: s.min_semester != null ? String(s.min_semester) : '',
      max_semester: s.max_semester != null ? String(s.max_semester) : '',
    });

    setRequirements(
      (requirementsRes.data ?? []).map((r) => ({
        id: r.id,
        requirement_type: r.requirement_type,
        requirement_label: r.requirement_label,
        requirement_value: r.requirement_value ?? '',
        is_required: r.is_required,
      }))
    );

    setDocuments(
      (documentsRes.data ?? []).map((d) => ({ id: d.id, document_label: d.document_label }))
    );

    setLoading(false);
  };

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleEducationLevel = (level: string) => {
    setForm((prev) => ({
      ...prev,
      education_level: prev.education_level.includes(level)
        ? prev.education_level.filter((l) => l !== level)
        : [...prev.education_level, level],
    }));
  };

  // ------------------------------------------------------------
  // Validation (mirror aturan poin 17 di brief)
  // ------------------------------------------------------------

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Nama beasiswa wajib diisi.';
    if (!form.provider_name.trim()) return 'Penyelenggara wajib diisi.';
    if (!form.application_start) return 'Tanggal buka wajib diisi.';
    if (!form.application_deadline) return 'Deadline wajib diisi.';
    if (form.application_deadline < form.application_start) {
      return 'Deadline tidak boleh sebelum tanggal buka.';
    }
    if (form.min_ipk && (Number(form.min_ipk) < 0 || Number(form.min_ipk) > 4)) {
      return 'IPK minimum harus di antara 0 dan 4.';
    }
    if (
      form.min_semester &&
      form.max_semester &&
      Number(form.max_semester) < Number(form.min_semester)
    ) {
      return 'Semester maksimum tidak boleh lebih kecil dari semester minimum.';
    }
    if (form.amount && Number(form.amount) < 0) return 'Nominal tidak boleh negatif.';
    if (!form.official_source_url && !form.registration_url) {
      return 'Isi minimal salah satu: Sumber Resmi atau Link Pendaftaran.';
    }
    for (const url of [form.official_source_url, form.registration_url, form.provider_logo_url]) {
      if (url && !isValidUrl(url)) return `URL tidak valid: ${url}`;
    }
    return null;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // ------------------------------------------------------------
  // Submit
  // ------------------------------------------------------------

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }
    setErrorMsg(null);
    setSaving(true);

    const { data: userData } = await supabase.auth.getUser();

    const payload = {
      name: form.name.trim(),
      provider_name: form.provider_name.trim(),
      provider_logo_url: form.provider_logo_url.trim() || null,
      description: form.description.trim() || null,
      category: form.category,
      education_level: form.education_level,
      application_start: form.application_start,
      application_deadline: form.application_deadline,
      application_deadline_time: form.application_deadline_time || null,
      amount: form.amount ? Number(form.amount) : null,
      currency: form.currency,
      region: form.region.trim() || null,
      official_source_url: form.official_source_url.trim() || null,
      registration_url: form.registration_url.trim() || null,
      verification_status: form.verification_status,
      eligible_faculties: form.eligible_faculties
        ? form.eligible_faculties.split(',').map((s) => s.trim()).filter(Boolean)
        : null,
      eligible_programs: form.eligible_programs
        ? form.eligible_programs.split(',').map((s) => s.trim()).filter(Boolean)
        : null,
      min_ipk: form.min_ipk ? Number(form.min_ipk) : null,
      min_semester: form.min_semester ? Number(form.min_semester) : null,
      max_semester: form.max_semester ? Number(form.max_semester) : null,
      ...(form.verification_status !== 'unverified'
        ? { last_verified_at: new Date().toISOString(), verified_by: userData.user?.id ?? null }
        : {}),
    };

    let targetId = scholarshipId;

    if (isEditMode) {
      const { error: updateError } = await supabase
        .from('scholarships')
        .update(payload)
        .eq('id', scholarshipId);
      if (updateError) {
        setErrorMsg(`Gagal menyimpan: ${updateError.message}`);
        setSaving(false);
        return;
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('scholarships')
        .insert({ ...payload, created_by: userData.user?.id ?? null })
        .select('id')
        .single();
      if (insertError || !inserted) {
        setErrorMsg(`Gagal membuat beasiswa: ${insertError?.message}`);
        setSaving(false);
        return;
      }
      targetId = inserted.id;
    }

    // Sync requirements: hapus yang ditandai, upsert sisanya
    if (deletedRequirementIds.length > 0) {
      await supabase.from('scholarship_requirements').delete().in('id', deletedRequirementIds);
    }
    for (const req of requirements) {
      if (!req.requirement_label.trim()) continue;
      if (req.id) {
        await supabase
          .from('scholarship_requirements')
          .update({
            requirement_type: req.requirement_type,
            requirement_label: req.requirement_label.trim(),
            requirement_value: req.requirement_value.trim() || null,
            is_required: req.is_required,
          })
          .eq('id', req.id);
      } else {
        await supabase.from('scholarship_requirements').insert({
          scholarship_id: targetId,
          requirement_type: req.requirement_type,
          requirement_label: req.requirement_label.trim(),
          requirement_value: req.requirement_value.trim() || null,
          is_required: req.is_required,
        });
      }
    }

    // Sync documents
    if (deletedDocumentIds.length > 0) {
      await supabase.from('scholarship_documents').delete().in('id', deletedDocumentIds);
    }
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      if (!doc.document_label.trim()) continue;
      if (doc.id) {
        await supabase
          .from('scholarship_documents')
          .update({ document_label: doc.document_label.trim(), sort_order: i })
          .eq('id', doc.id);
      } else {
        await supabase.from('scholarship_documents').insert({
          scholarship_id: targetId,
          document_label: doc.document_label.trim(),
          sort_order: i,
        });
      }
    }

    setSaving(false);
    router.push('/admin/beasiswa');
  };

  // ------------------------------------------------------------
  // Requirement/document row helpers
  // ------------------------------------------------------------

  const addRequirement = () => {
    setRequirements((prev) => [
      ...prev,
      { requirement_type: 'lainnya', requirement_label: '', requirement_value: '', is_required: true },
    ]);
  };

  const updateRequirement = (index: number, patch: Partial<RequirementRow>) => {
    setRequirements((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const removeRequirement = (index: number) => {
    const row = requirements[index];
    if (row.id) setDeletedRequirementIds((prev) => [...prev, row.id!]);
    setRequirements((prev) => prev.filter((_, i) => i !== index));
  };

  const addDocument = () => {
    setDocuments((prev) => [...prev, { document_label: '' }]);
  };

  const updateDocument = (index: number, label: string) => {
    setDocuments((prev) => prev.map((d, i) => (i === index ? { ...d, document_label: label } : d)));
  };

  const removeDocument = (index: number) => {
    const row = documents[index];
    if (row.id) setDeletedDocumentIds((prev) => [...prev, row.id!]);
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  // ------------------------------------------------------------
  // Render
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
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6 pb-32">

        <button
          onClick={() => router.push('/admin/beasiswa')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-all"
        >
          <ArrowLeft size={14} /> Kembali
        </button>

        <h1 className="text-xl font-black text-slate-900 dark:text-white">
          {isEditMode ? 'Edit Beasiswa' : 'Tambah Beasiswa'}
        </h1>

        {errorMsg && (
          <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl p-4 text-rose-700 dark:text-rose-400 text-xs font-bold">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {errorMsg}
          </div>
        )}

        {/* SECTION: Info dasar */}
        <Section title="Informasi Dasar">
          <Field label="Nama Beasiswa *">
            <input
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Penyelenggara *">
            <input
              value={form.provider_name}
              onChange={(e) => updateField('provider_name', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="URL Logo Penyelenggara">
            <input
              value={form.provider_logo_url}
              onChange={(e) => updateField('provider_logo_url', e.target.value)}
              placeholder="https://..."
              className="input"
            />
          </Field>
          <Field label="Deskripsi">
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
              className="input resize-none"
            />
          </Field>
          <Field label="Kategori">
            <select
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              className="input"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Jenjang">
            <div className="flex flex-wrap gap-2">
              {EDUCATION_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleEducationLevel(level)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    form.education_level.includes(level)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </Field>
        </Section>

        {/* SECTION: Periode & deadline */}
        <Section title="Periode Pendaftaran">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tanggal Buka *">
              <input
                type="date"
                value={form.application_start}
                onChange={(e) => updateField('application_start', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Deadline *">
              <input
                type="date"
                value={form.application_deadline}
                onChange={(e) => updateField('application_deadline', e.target.value)}
                className="input"
              />
            </Field>
          </div>
          <Field label="Jam Deadline (opsional)">
            <input
              type="time"
              value={form.application_deadline_time}
              onChange={(e) => updateField('application_deadline_time', e.target.value)}
              className="input"
            />
          </Field>
        </Section>

        {/* SECTION: Nominal & wilayah */}
        <Section title="Nominal & Wilayah">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nominal Bantuan">
              <input
                type="number"
                min={0}
                value={form.amount}
                onChange={(e) => updateField('amount', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Mata Uang">
              <input
                value={form.currency}
                onChange={(e) => updateField('currency', e.target.value)}
                className="input"
              />
            </Field>
          </div>
          <Field label="Wilayah">
            <input
              value={form.region}
              onChange={(e) => updateField('region', e.target.value)}
              placeholder="mis. Jawa Timur"
              className="input"
            />
          </Field>
        </Section>

        {/* SECTION: Eligibility */}
        <Section title="Persyaratan Utama">
          <div className="grid grid-cols-3 gap-3">
            <Field label="IPK Minimum">
              <input
                type="number"
                step="0.01"
                min={0}
                max={4}
                value={form.min_ipk}
                onChange={(e) => updateField('min_ipk', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Min. Semester">
              <input
                type="number"
                min={1}
                value={form.min_semester}
                onChange={(e) => updateField('min_semester', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Maks. Semester">
              <input
                type="number"
                min={1}
                value={form.max_semester}
                onChange={(e) => updateField('max_semester', e.target.value)}
                className="input"
              />
            </Field>
          </div>
          <Field label="Fakultas Eligible (pisahkan koma, kosongkan jika semua fakultas)">
            <input
              value={form.eligible_faculties}
              onChange={(e) => updateField('eligible_faculties', e.target.value)}
              placeholder="Fakultas Pertanian, Fakultas Teknik"
              className="input"
            />
          </Field>
          <Field label="Program Studi Eligible (pisahkan koma, kosongkan jika semua prodi)">
            <input
              value={form.eligible_programs}
              onChange={(e) => updateField('eligible_programs', e.target.value)}
              placeholder="Agroteknologi, Informatika"
              className="input"
            />
          </Field>
        </Section>

        {/* SECTION: Requirements dinamis */}
        <Section title="Persyaratan Tambahan">
          <div className="space-y-3">
            {requirements.map((req, i) => (
              <div key={i} className="flex gap-2 items-start">
                <input
                  value={req.requirement_label}
                  onChange={(e) => updateRequirement(i, { requirement_label: e.target.value })}
                  placeholder="Label (mis. Surat Rekomendasi)"
                  className="input flex-1"
                />
                <input
                  value={req.requirement_value}
                  onChange={(e) => updateRequirement(i, { requirement_value: e.target.value })}
                  placeholder="Detail (opsional)"
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeRequirement(i)}
                  className="w-10 h-10 shrink-0 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-all"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addRequirement}
              className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400"
            >
              <Plus size={14} /> Tambah Persyaratan
            </button>
          </div>
        </Section>

        {/* SECTION: Checklist dokumen */}
        <Section title="Checklist Dokumen">
          <div className="space-y-3">
            {documents.map((doc, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  value={doc.document_label}
                  onChange={(e) => updateDocument(i, e.target.value)}
                  placeholder="mis. Transkrip Nilai"
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeDocument(i)}
                  className="w-10 h-10 shrink-0 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-all"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addDocument}
              className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400"
            >
              <Plus size={14} /> Tambah Dokumen
            </button>
          </div>
        </Section>

        {/* SECTION: Sumber & verifikasi */}
        <Section title="Sumber & Verifikasi">
          <Field label="URL Sumber Resmi">
            <input
              value={form.official_source_url}
              onChange={(e) => updateField('official_source_url', e.target.value)}
              placeholder="https://..."
              className="input"
            />
          </Field>
          <Field label="URL Pendaftaran">
            <input
              value={form.registration_url}
              onChange={(e) => updateField('registration_url', e.target.value)}
              placeholder="https://..."
              className="input"
            />
          </Field>
          <Field label="Status Verifikasi">
            <select
              value={form.verification_status}
              onChange={(e) => updateField('verification_status', e.target.value)}
              className="input"
            >
              {VERIFICATION_OPTIONS.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </Field>
          <p className="text-[11px] text-slate-400 font-medium">
            Mengubah status verifikasi (selain Unverified) akan otomatis memperbarui tanggal
            &quot;Terakhir diverifikasi&quot; ke hari ini.
          </p>
        </Section>
      </div>

      {/* STICKY SAVE BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#141414] border-t border-slate-100 dark:border-white/10 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white text-sm font-bold py-3.5 rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isEditMode ? 'Simpan Perubahan' : 'Buat Beasiswa'}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          background: white;
          border: 1px solid rgb(241 245 249);
          border-radius: 0.75rem;
          padding: 0.65rem 0.9rem;
          font-size: 0.8rem;
          font-weight: 500;
          color: rgb(51 65 85);
        }
        .dark .input {
          background: #1c1c1c;
          border-color: rgba(255, 255, 255, 0.1);
          color: rgb(226 232 240);
        }
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.4);
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#141414] rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-white/10 space-y-4">
      <h2 className="font-black text-slate-900 dark:text-white text-sm">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</label>
      {children}
    </div>
  );
}