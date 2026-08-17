"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  KeyRound,
  Mail,
  ShieldCheck,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";

type Step = "request" | "verify" | "newPassword";

function LupaPasswordForm() {
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") || "";

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState(emailFromUrl);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false); // 👈 state baru, khusus indikator redirect

  const supabase = createClient();
  const router = useRouter();

  // Step 1: kirim kode OTP ke email
  const handleRequestOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!email) {
      setError("Masukkan email kamu terlebih dahulu.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    setLoading(false);

    if (error) {
      setError("Gagal mengirim kode. Pastikan email terdaftar, lalu coba lagi.");
    } else {
      setInfo(`Kode OTP sudah dikirim ke ${email}. Cek inbox (dan folder spam) kamu.`);
      setStep("verify");
    }
  };

  // Step 2: verifikasi kode OTP
  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!otp) {
      setError("Masukkan kode OTP yang dikirim ke email kamu.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "recovery",
    });

    setLoading(false);

    if (error) {
      setError("Kode OTP salah atau sudah kadaluarsa.");
    } else {
      setInfo(""); // 👈 reset biar gak kebawa ke step berikutnya
      setStep("newPassword");
    }
  };

  // Step 3: set password baru
  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setError("Gagal mengganti password. Coba lagi beberapa saat.");
    } else {
      setRedirecting(true); // 👈 dipisah dari `info`, khusus nandain lagi proses redirect
      setInfo("Password berhasil diubah! Mengarahkan ke halaman login...");
      setTimeout(() => {
        router.push("/login");
      }, 1800);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    setLoading(false);

    if (error) {
      setError("Gagal mengirim ulang kode. Coba lagi.");
    } else {
      setInfo(`Kode baru sudah dikirim ke ${email}.`);
    }
  };

  const stepIcon: Record<Step, React.ReactNode> = {
    request: <Mail size={28} color="white" />,
    verify: <ShieldCheck size={28} color="white" />,
    newPassword: <KeyRound size={28} color="white" />,
  };

  const stepTitle: Record<Step, string> = {
    request: "Lupa Password",
    verify: "Verifikasi Kode OTP",
    newPassword: "Buat Password Baru",
  };

  const stepSubtitle: Record<Step, string> = {
    request: "Masukkan email yang terdaftar untuk menerima kode OTP",
    verify: "Masukkan kode OTP yang dikirim ke email kamu",
    newPassword: "Masukkan password baru untuk akun kamu",
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[30px] shadow-xl border border-slate-200 p-8">
          {step !== "request" && step !== "newPassword" && (
            <button
              onClick={() => {
                setStep("request");
                setError("");
                setInfo("");
              }}
              className="flex items-center gap-1 text-xs font-bold text-slate-400 mb-4"
            >
              <ArrowLeft size={14} /> Ganti email
            </button>
          )}

          <div className="w-16 h-16 rounded-full bg-[#800020] flex items-center justify-center mx-auto mb-5">
            {stepIcon[step]}
          </div>

          <h1 className="text-lg font-black uppercase tracking-tight text-slate-800 text-center">
            {stepTitle[step]}
          </h1>
          <p className="text-xs text-slate-400 text-center mt-1 mb-6">
            {stepSubtitle[step]}
          </p>

          {/* STEP 1: Request OTP */}
          {step === "request" && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">
                  Email
                </label>
                <div className="flex items-center gap-3 border-2 border-slate-100 rounded-2xl p-3 focus-within:border-[#800020]/40 transition-colors">
                  <Mail size={18} className="text-slate-400 shrink-0" />
                  <input
                    type="email"
                    placeholder="email@kampus.ac.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm font-semibold text-slate-700 outline-none bg-transparent"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-center px-3 py-2 rounded-xl bg-red-50 text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#800020] text-white text-sm font-bold py-3 rounded-2xl hover:bg-[#800020]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Mengirim..." : "Kirim Kode OTP"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full text-xs font-bold text-slate-400 text-center py-1"
              >
                Kembali ke Login
              </button>
            </form>
          )}

          {/* STEP 2: Verify OTP */}
          {step === "verify" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {info && (
                <p className="text-xs text-center px-3 py-2 rounded-xl bg-green-50 text-green-700">
                  {info}
                </p>
              )}

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">
                  Kode OTP
                </label>
                <div className="flex items-center gap-3 border-2 border-slate-100 rounded-2xl p-3 focus-within:border-[#800020]/40 transition-colors">
                  <ShieldCheck size={18} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 12345678"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full text-sm font-semibold text-slate-700 outline-none bg-transparent tracking-widest"
                    maxLength={8}
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-center px-3 py-2 rounded-xl bg-red-50 text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#800020] text-white text-sm font-bold py-3 rounded-2xl hover:bg-[#800020]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Memverifikasi..." : "Verifikasi Kode"}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="w-full text-xs font-bold text-[#800020] text-center py-1"
              >
                Kirim ulang kode
              </button>
            </form>
          )}

          {/* STEP 3: New Password */}
          {step === "newPassword" && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {info && (
                <p className="text-xs text-center px-3 py-2 rounded-xl bg-green-50 text-green-700">
                  {info}
                </p>
              )}

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">
                  Password Baru
                </label>
                <div className="flex items-center gap-3 border-2 border-slate-100 rounded-2xl p-3 focus-within:border-[#800020]/40 transition-colors">
                  <Lock size={18} className="text-slate-400 shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-sm font-semibold text-slate-700 outline-none bg-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="shrink-0 text-slate-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">
                  Konfirmasi Password
                </label>
                <div className="flex items-center gap-3 border-2 border-slate-100 rounded-2xl p-3 focus-within:border-[#800020]/40 transition-colors">
                  <Lock size={18} className="text-slate-400 shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Ulangi password baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full text-sm font-semibold text-slate-700 outline-none bg-transparent"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-center px-3 py-2 rounded-xl bg-red-50 text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || redirecting}
                className="w-full bg-[#800020] text-white text-sm font-bold py-3 rounded-2xl hover:bg-[#800020]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {(loading || redirecting) && <Loader2 size={16} className="animate-spin" />}
                {redirecting ? "Mengarahkan..." : loading ? "Menyimpan..." : "Simpan Password Baru"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LupaPassword() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="animate-spin text-[#800020]" size={28} />
        </div>
      }
    >
      <LupaPasswordForm />
    </Suspense>
  );
}
