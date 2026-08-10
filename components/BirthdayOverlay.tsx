"use client";
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Gift, X, Sparkles, Heart, Flame, Download } from 'lucide-react';
import { toast } from 'sonner';

type BirthdayUser = {
  id: string;
  nama: string;
  birthday_photo_url: string | null;
  birthday_date: string;
};

function parseDateOnly(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

const CONFETTI_COLORS = ['#f472b6', '#facc15', '#38bdf8', '#a78bfa', '#4ade80', '#fb923c'];
const BALLOON_COLORS = ['#f472b6', '#818cf8', '#facc15', '#4ade80', '#38bdf8', '#fb7185'];
const PARTY_EMOJIS = ['🎉', '🎊', '🎈', '🎂', '🎁', '✨', '🥳', '🍰'];
const FIREWORK_COLORS = ['#f472b6', '#facc15', '#38bdf8', '#a78bfa', '#4ade80', '#fb923c', '#fb7185', '#22d3ee'];
const LOVE_EMOJIS = ['💗', '💕', '💖', '❤️', '💞', '💓'];

// Kumpulan ucapan hangat dari "Zora" — {nama} otomatis diganti nama depan user.
// Sengaja cuma dipakai di beberapa pesan aja (bukan semua) biar kedengeran natural,
// sisanya pakai "kamu" biar ga kaku/ngulang-ulang panggilan nama.
// Setiap kali overlay dibuka, sejumlah kalimat dipilih & diacak dari daftar ini.
const PESAN_POOL = [
  "Selamat ulang tahun, {nama} 🎂 Zora ikut senang bisa nemenin hari spesialmu.",
  "Terima kasih ya udah jadi bagian dari kelas ini. Kehadiranmu berarti banget.",
  "Semoga satu tahun ke depan penuh hal-hal baik yang kamu perjuangkan selama ini.",
  "Nggak semua orang bertahan sejauh ini. Kamu hebat, dan itu layak dirayakan.",
  "Semoga capek-capekmu selama ini nggak pernah sia-sia. Selamat ulang tahun 🎈",
  "Zora doain semoga kamu makin sehat, makin bahagia, dan makin dikelilingi orang baik.",
  "Terima kasih sudah jadi {nama} yang seperti sekarang — apa adanya, dan itu cukup.",
  "Semoga tahun ini jadi versi terbaikmu, pelan-pelan aja nggak apa-apa.",
  "Kamu udah berjuang jauh lebih keras dari yang orang lain tahu. Selamat ulang tahun 🎉",
  "Boleh capek, boleh istirahat — tapi jangan pernah berhenti percaya sama dirimu sendiri.",
  "Semoga mimpi-mimpimu tahun ini satu per satu mulai kelihatan jalannya.",
  "Terima kasih udah nemenin hari-hari di kelas ini. Semoga ulang tahunmu seindah harapanmu.",
  "Semoga kamu selalu diberi kekuatan buat jadi baik meski dunia kadang berat.",
  "Zora selalu ada buat bantu kamu di kelas — tapi hari ini, giliran kamu yang dirayakan 🥳",
  "Semoga rezeki, kesehatan, dan kebahagiaan selalu nemenin kamu di manapun berada.",
  "Kamu pantas dapat hari yang bahagia, {nama}. Selamat merayakan dirimu sendiri hari ini 🎁",
];

// Pesan penutup tetap (fix, bukan acak) — jadi jembatan ke finale love di akhir.
const CLOSING_MESSAGE = "Ada hadiah lagi dari Zora... 🎁";

function ambilPesanAcak(nama: string, jumlah: number): string[] {
  const shuffled = [...PESAN_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, jumlah).map((p) => p.replace(/{nama}/g, nama.split(' ')[0]));
}

const TYPING_DURATION = 1400; // durasi bubble "mengetik..." — diperlambat biar terasa natural
const MESSAGE_DURATION = 5200; // durasi pesan tampil — diperlambat biar sempat dibaca santai, ga keburu-buru
const JUMLAH_PESAN = 12; // total pesan acak sebelum masuk pesan penutup + finale love
const CLOSING_MESSAGE_DURATION = 2800; // durasi pesan penutup "Ada hadiah lagi dari Zora" tampil

export default function BirthdayOverlay() {
  const [users, setUsers] = useState<BirthdayUser[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [opened, setOpened] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const supabase = createClient();

  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [chatIndex, setChatIndex] = useState(0);
  const [chatPhase, setChatPhase] = useState<'idle' | 'typing' | 'message'>('idle');
  const [isClosingMessage, setIsClosingMessage] = useState(false);
  const [showFinale, setShowFinale] = useState(false);
  // Tahapan finale interaktif: niup lilin dulu -> burst love sebentar -> kartu ucapan bisa didownload
  const [finaleStage, setFinaleStage] = useState<'candles' | 'burst' | 'card'>('candles');
  const [blownCandles, setBlownCandles] = useState<number[]>([]);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const finaleTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const todayKey = `birthday-seen-${new Date().toISOString().slice(0, 10)}`;
    if (typeof window === 'undefined' || sessionStorage.getItem(todayKey)) return;

    const cekUlangTahun = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('profiles')
        .select('id, nama, birthday_photo_url, birthday_date')
        .not('birthday_date', 'is', null);

      if (error || !data) return;

      const today = new Date();
      const yangUlangTahun = data.filter((u) => {
        const { month, day } = parseDateOnly(u.birthday_date as string);
        return day === today.getDate() && month === today.getMonth();
      }) as BirthdayUser[];

      if (yangUlangTahun.length === 0) return;

      // Pisahkan: diri sendiri (dapat overlay penuh) vs orang lain (dapat toast singkat saja)
      const ulangTahunSaya = yangUlangTahun.filter((u) => u.id === currentUser?.id);
      const ulangTahunOrangLain = yangUlangTahun.filter((u) => u.id !== currentUser?.id);

      if (ulangTahunSaya.length > 0) {
        setUsers(ulangTahunSaya);
        setVisible(true);
      } else if (ulangTahunOrangLain.length > 0) {
        if (ulangTahunOrangLain.length === 1) {
          toast(`🎉 Hari ini ${ulangTahunOrangLain[0].nama.split(' ')[0]} lagi ulang tahun!`, {
            description: 'Yuk kasih ucapan ke dia hari ini 💜',
            duration: 8000,
          });
        } else {
          const namaDepan = ulangTahunOrangLain.map((u) => u.nama.split(' ')[0]).join(', ');
          toast(`🎉 Hari ini ada yang ulang tahun!`, {
            description: `${namaDepan} lagi merayakan ulang tahun mereka hari ini 💜`,
            duration: 8000,
          });
        }
      }

      sessionStorage.setItem(todayKey, '1');
    };

    cekUlangTahun();
  }, []);

  const clearAllChatTimers = () => {
    chatTimersRef.current.forEach((t) => clearTimeout(t));
    chatTimersRef.current = [];
  };

  const clearFinaleTimers = () => {
    finaleTimersRef.current.forEach((t) => clearTimeout(t));
    finaleTimersRef.current = [];
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      clearAllChatTimers();
      clearFinaleTimers();
    };
  }, []);

  // Jalanin urutan chat bubble begitu konten ucapan muncul (showContent = true).
  // Alurnya: pesan acak satu-satu -> pesan penutup "Ada hadiah lagi dari Zora" -> finale love.
  useEffect(() => {
    if (!showContent || users.length === 0) return;

    const pesanTerpilih = ambilPesanAcak(users[activeIndex].nama, JUMLAH_PESAN);
    setChatMessages(pesanTerpilih);

    let idx = 0;
    const jalankanPesan = () => {
      if (idx >= pesanTerpilih.length) {
        // Semua pesan acak sudah tampil — lanjut ke pesan penutup tetap
        setIsClosingMessage(true);
        setChatPhase('typing');

        const tClosingTyping = setTimeout(() => {
          setChatPhase('message');

          const tClosingMsg = setTimeout(() => {
            // Mulai dari sini interaktif (niup lilin), jadi timer auto-close dimatiin
            // biar user nggak keburu ke-skip pas lagi berinteraksi.
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
            setFinaleStage('candles');
            setShowFinale(true);
          }, CLOSING_MESSAGE_DURATION);
          chatTimersRef.current.push(tClosingMsg);
        }, TYPING_DURATION);
        chatTimersRef.current.push(tClosingTyping);
        return;
      }

      setChatIndex(idx);
      setChatPhase('typing');

      const tTyping = setTimeout(() => {
        setChatPhase('message');
        const tMessage = setTimeout(() => {
          idx += 1;
          jalankanPesan();
        }, MESSAGE_DURATION);
        chatTimersRef.current.push(tMessage);
      }, TYPING_DURATION);
      chatTimersRef.current.push(tTyping);
    };

    jalankanPesan();

    return () => clearAllChatTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showContent]);

  const fallingConfetti = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 6 + Math.random() * 8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        duration: 4 + Math.random() * 5,
        delay: Math.random() * 6,
        rotateStart: Math.random() * 360,
        shape: Math.random() > 0.5 ? '50%' : '2px',
      })),
    []
  );

  const balloons = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => ({
        id: i,
        left: 5 + i * 13 + Math.random() * 6,
        color: BALLOON_COLORS[i % BALLOON_COLORS.length],
        duration: 6 + Math.random() * 4,
        delay: Math.random() * 3,
        size: 44 + Math.random() * 20,
      })),
    []
  );

  const floatingEmojis = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        id: i,
        emoji: PARTY_EMOJIS[i % PARTY_EMOJIS.length],
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 3 + Math.random() * 3,
        delay: Math.random() * 4,
        size: 20 + Math.random() * 20,
      })),
    []
  );

  const burstConfetti = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        id: i,
        left: Math.random() * 200 - 100,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 0.3,
        distance: 100 + Math.random() * 80,
      })),
    []
  );

  // Kembang api yang meletus berulang di beberapa titik selama overlay tampil.
  const fireworks = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => {
        const particleCount = 10 + Math.floor(Math.random() * 4);
        return {
          id: i,
          left: 8 + Math.random() * 84,
          top: 8 + Math.random() * 48,
          color: FIREWORK_COLORS[i % FIREWORK_COLORS.length],
          cycleDuration: 3 + Math.random() * 2.2,
          delay: Math.random() * 5,
          particles: Array.from({ length: particleCount }).map((__, p) => ({
            id: p,
            angle: (360 / particleCount) * p + Math.random() * 10,
            distance: 40 + Math.random() * 35,
          })),
        };
      }),
    []
  );

  // Ornamen love kecil yang mengambang di sekitar love besar saat finale
  const loveOrnaments = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        emoji: LOVE_EMOJIS[i % LOVE_EMOJIS.length],
        left: 6 + Math.random() * 88,
        duration: 3.5 + Math.random() * 3,
        delay: Math.random() * 2.5,
        size: 16 + Math.random() * 18,
      })),
    []
  );

  // User niup lilin satu-satu (tap tiap lilin). Begitu 3-3 nya padam,
  // lanjut ke burst love sebentar, baru reveal kartu ucapan yang bisa didownload.
  const handleBlowCandle = (i: number) => {
    if (blownCandles.includes(i) || finaleStage !== 'candles') return;
    const next = [...blownCandles, i];
    setBlownCandles(next);

    if (next.length === 3) {
      const tBurst = setTimeout(() => setFinaleStage('burst'), 500);
      finaleTimersRef.current.push(tBurst);
      const tCard = setTimeout(() => setFinaleStage('card'), 500 + 1900);
      finaleTimersRef.current.push(tCard);
    }
  };

  // Bikin gambar kartu ucapan pakai canvas: foto (kalau ada) + nama + pesan dari Zora,
  // dengan desain senada tema pink-purple-gold yang dipakai di overlay ini.
  const generateCard = async (nama: string, photoUrl: string | null) => {
    setCardLoading(true);
    const width = 1080;
    const height = 1350;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setCardLoading(false);
      return;
    }

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#2e1065');
    bg.addColorStop(0.5, '#581c5e');
    bg.addColorStop(1, '#831843');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Bokeh dots dekoratif
    const dotColors = ['#f472b6', '#facc15', '#a78bfa', '#38bdf8', '#fb7185'];
    for (let i = 0; i < 45; i++) {
      ctx.beginPath();
      const r = 3 + Math.random() * 9;
      ctx.fillStyle = dotColors[i % dotColors.length];
      ctx.globalAlpha = 0.18 + Math.random() * 0.25;
      ctx.arc(Math.random() * width, Math.random() * height, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Foto bulat (kalau ada & bisa dimuat via CORS), fallback ke emoji kue
    const photoCenterY = 300;
    const photoRadius = 155;

    const drawFallbackPhoto = () => {
      const grad = ctx.createLinearGradient(
        width / 2 - photoRadius, photoCenterY - photoRadius,
        width / 2 + photoRadius, photoCenterY + photoRadius
      );
      grad.addColorStop(0, '#f472b6');
      grad.addColorStop(1, '#a78bfa');
      ctx.save();
      ctx.beginPath();
      ctx.arc(width / 2, photoCenterY, photoRadius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.font = '130px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎂', width / 2, photoCenterY + 10);
      ctx.restore();
    };

    const drawRing = () => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(width / 2, photoCenterY, photoRadius + 14, 0, Math.PI * 2);
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#f9a8d4';
      ctx.shadowColor = 'rgba(244,114,182,0.7)';
      ctx.shadowBlur = 35;
      ctx.stroke();
      ctx.restore();
    };

    const finishCard = () => {
      drawRing();

      // Nama besar
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 64px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 14;
      ctx.fillText('Selamat Ulang Tahun,', width / 2, 560);

      const nameGrad = ctx.createLinearGradient(width / 2 - 300, 0, width / 2 + 300, 0);
      nameGrad.addColorStop(0, '#f9a8d4');
      nameGrad.addColorStop(0.5, '#fde68a');
      nameGrad.addColorStop(1, '#d8b4fe');
      ctx.fillStyle = nameGrad;
      ctx.font = '900 78px sans-serif';
      ctx.fillText(`${nama}!`, width / 2, 660);
      ctx.shadowBlur = 0;

      // Pesan singkat
      ctx.font = '400 34px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      const pesan = [
        'Terima kasih sudah jadi bagian dari kelas ini.',
        'Semoga hari ini penuh tawa, dan tahun ke depan',
        'penuh hal-hal baik yang kamu perjuangkan. 💜',
      ];
      pesan.forEach((line, i) => {
        ctx.fillText(line, width / 2, 780 + i * 52);
      });

      // Heart besar dekoratif
      ctx.font = '110px sans-serif';
      ctx.fillText('❤️', width / 2, 1020);

      // Footer
      ctx.font = '600 30px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillText('dengan cinta, Zora 💜', width / 2, 1160);

      const tanggal = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      ctx.font = '400 24px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText(tanggal, width / 2, 1210);

      setCardDataUrl(canvas.toDataURL('image/png'));
      setCardLoading(false);
    };

    if (photoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          ctx.save();
          ctx.beginPath();
          ctx.arc(width / 2, photoCenterY, photoRadius, 0, Math.PI * 2);
          ctx.clip();
          // Cover-fit foto ke lingkaran
          const scale = Math.max((photoRadius * 2) / img.width, (photoRadius * 2) / img.height);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          ctx.drawImage(
            img,
            width / 2 - drawW / 2,
            photoCenterY - drawH / 2,
            drawW,
            drawH
          );
          ctx.restore();
        } catch {
          drawFallbackPhoto();
        }
        finishCard();
      };
      img.onerror = () => {
        drawFallbackPhoto();
        finishCard();
      };
      img.src = photoUrl;
    } else {
      drawFallbackPhoto();
      finishCard();
    }
  };

  useEffect(() => {
    if (finaleStage === 'card' && !cardDataUrl && !cardLoading && users.length > 0) {
      generateCard(users[activeIndex].nama, users[activeIndex].birthday_photo_url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finaleStage]);

  const handleBukaKado = () => {
    if (opened) return;
    setOpened(true);

    audioRef.current?.play().catch(() => {});

    setTimeout(() => setShowContent(true), 700);
    // Lagu berdurasi 1 menit 36 detik (96.000ms) + jeda 2 detik sebelum overlay auto-close.
    // Pesan acak + pesan penutup selesai sekitar detik ke-83, sisanya jadi waktu finale love.
    closeTimerRef.current = setTimeout(() => setVisible(false), 96000 + 2000);
  };

  const handleSkip = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    clearAllChatTimers();
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setVisible(false);
  };

  if (!visible || users.length === 0) return null;

  const activeUser = users[activeIndex];
  const namaDepan = activeUser.nama.split(' ')[0];
  const currentBubbleText = isClosingMessage ? CLOSING_MESSAGE : chatMessages[chatIndex];

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-950/90 via-purple-950/90 to-pink-950/90 backdrop-blur-sm">
      <audio ref={audioRef} src="/sounds/birthday-song.mp3" preload="auto" />

      {/* Kembang api meletus-letus di latar belakang */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {fireworks.map((fw) => (
          <div
            key={fw.id}
            className="firework-wrap"
            style={{
              left: `${fw.left}%`,
              top: `${fw.top}%`,
              animationDuration: `${fw.cycleDuration}s`,
              animationDelay: `${fw.delay}s`,
            }}
          >
            <span
              className="firework-flash"
              style={{
                background: fw.color,
                animationDuration: `${fw.cycleDuration}s`,
                animationDelay: `${fw.delay}s`,
              }}
            />
            {fw.particles.map((p) => (
              <span
                key={p.id}
                className="firework-particle"
                style={{
                  background: fw.color,
                  animationDuration: `${fw.cycleDuration}s`,
                  animationDelay: `${fw.delay}s`,
                  // @ts-ignore custom props dipakai di keyframes
                  '--angle': `${p.angle}deg`,
                  '--dist': `${p.distance}px`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Confetti jatuh terus-menerus */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {fallingConfetti.map((c) => (
          <span
            key={c.id}
            className="confetti-fall-loop"
            style={{
              left: `${c.left}%`,
              width: c.size,
              height: c.size,
              background: c.color,
              borderRadius: c.shape,
              animationDuration: `${c.duration}s`,
              animationDelay: `${c.delay}s`,
              // @ts-ignore custom prop dipakai di keyframes
              '--rot-start': `${c.rotateStart}deg`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Balon-balon mengambang naik */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {balloons.map((b) => (
          <div
            key={b.id}
            className="balloon-float"
            style={{
              left: `${b.left}%`,
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
            }}
          >
            <svg width={b.size} height={b.size * 1.25} viewBox="0 0 44 55" fill="none">
              <ellipse cx="22" cy="22" rx="20" ry="22" fill={b.color} opacity={0.85} />
              <path d="M22 44 L18 50 L26 50 Z" fill={b.color} opacity={0.85} />
              <line x1="22" y1="50" x2="22" y2="55" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            </svg>
          </div>
        ))}
      </div>

      {/* Emoji party mengambang */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {floatingEmojis.map((e) => (
          <span
            key={e.id}
            className="emoji-drift"
            style={{
              left: `${e.left}%`,
              top: `${e.top}%`,
              fontSize: e.size,
              animationDuration: `${e.duration}s`,
              animationDelay: `${e.delay}s`,
            }}
          >
            {e.emoji}
          </span>
        ))}
      </div>

      {/* Ornamen love kecil mengambang — tampil pas burst love & kartu ucapan */}
      {showFinale && (finaleStage === 'burst' || finaleStage === 'card') && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {loveOrnaments.map((h) => (
            <span
              key={h.id}
              className="love-float"
              style={{
                left: `${h.left}%`,
                fontSize: h.size,
                animationDuration: `${h.duration}s`,
                animationDelay: `${h.delay}s`,
              }}
            >
              {h.emoji}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-20 text-white/70 hover:text-white transition-colors"
        aria-label="Tutup"
      >
        <X size={24} />
      </button>

      {/* KONDISI 1: kado belum dibuka */}
      {!opened && (
        <button
          onClick={handleBukaKado}
          className="group relative z-10 flex flex-col items-center gap-4 cursor-pointer"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-pink-400/30 blur-2xl animate-pulse-glow" />
            <Gift
              size={110}
              className="relative text-pink-300 animate-bounce-soft drop-shadow-[0_0_30px_rgba(244,114,182,0.7)]"
            />
            <span className="absolute -top-3 -right-3 text-2xl animate-wiggle">✨</span>
            <span className="absolute -bottom-2 -left-4 text-2xl animate-wiggle-delay">🎈</span>
          </div>
          <p className="text-white text-xl font-bold drop-shadow">
            🎉 Ada kejutan untuk {activeUser.nama} hari ini!
          </p>
          <span className="text-white/70 text-sm px-4 py-1.5 rounded-full border border-white/30 group-hover:bg-white/10 transition">
            Tap untuk buka
          </span>
        </button>
      )}

      {/* KONDISI 2: animasi transisi kado terbuka */}
      {opened && !showContent && (
        <div className="relative z-10 flex items-center justify-center">
          <Gift size={110} className="text-pink-300 animate-gift-open" />
          {burstConfetti.map((c) => (
            <span
              key={c.id}
              className="confetti-burst"
              style={{
                background: c.color,
                animationDelay: `${c.delay}s`,
                // @ts-ignore custom props
                '--tx': `${c.left}px`,
                '--ty': `${-c.distance}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* KONDISI 3: konten ucapan + chat bubble berkala, lalu finale love di akhir */}
      {showContent && (
        <div className="relative z-10 flex flex-col items-center gap-4 text-center px-6 animate-fade-in-up w-full max-w-md">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-pink-400/40 blur-xl animate-pulse-glow" />
            {activeUser.birthday_photo_url ? (
              <img
                src={activeUser.birthday_photo_url}
                alt={activeUser.nama}
                className="relative w-28 h-28 rounded-full object-cover border-4 border-pink-300 shadow-2xl"
              />
            ) : (
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-4xl shadow-2xl">
                🎂
              </div>
            )}
            <span className="absolute -top-2 -right-2 text-2xl animate-wiggle">🎉</span>
            <span className="absolute -bottom-1 -left-3 text-2xl animate-wiggle-delay">🎈</span>
          </div>

          {!showFinale && (
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-wiggle">🎊</span>
              <h2 className="text-white text-xl sm:text-2xl font-black drop-shadow">
                Selamat Ulang Tahun,{' '}
                <span className="bg-gradient-to-r from-pink-300 via-amber-200 to-purple-300 bg-clip-text text-transparent">
                  {activeUser.nama}!
                </span>
              </h2>
              <span className="text-2xl animate-wiggle-delay">🎊</span>
            </div>
          )}

          {/* Chat bubble ucapan dari Zora, berganti berkala selama lagu muter */}
          {!showFinale && (
            <div className="w-full min-h-[92px] flex items-start gap-2.5 mt-1">
              <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg mt-0.5">
                <Sparkles size={16} className="text-white" />
              </div>

              <div className="flex-1 text-left">
                <p className="text-[11px] font-bold text-white/50 mb-1 ml-1">Zora</p>

                {chatPhase === 'typing' && (
                  <div
                    key={`typing-${isClosingMessage ? 'closing' : chatIndex}`}
                    className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md rounded-2xl rounded-tl-sm px-4 py-3 animate-bubble-in"
                  >
                    <span className="typing-dot" />
                    <span className="typing-dot" style={{ animationDelay: '0.15s' }} />
                    <span className="typing-dot" style={{ animationDelay: '0.3s' }} />
                  </div>
                )}

                {chatPhase === 'message' && currentBubbleText && (
                  <div
                    key={`msg-${isClosingMessage ? 'closing' : chatIndex}`}
                    className="bg-white/15 backdrop-blur-md rounded-2xl rounded-tl-sm px-4 py-3 animate-bubble-in"
                  >
                    <p className="text-white text-sm leading-relaxed">
                      {currentBubbleText}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FINALE TAHAP 1: ajak tiup lilin dulu sebelum hadiah tambahan dibuka */}
          {showFinale && finaleStage === 'candles' && (
            <div className="w-full flex flex-col items-center gap-5 py-2 animate-fade-in-up">
              <p className="text-white/90 text-base font-semibold px-2">
                Masih ada hadiah lagi buat {namaDepan} 🎁
                <br />
                <span className="text-white/60 text-sm font-normal">
                  Tiup dulu lilinnya satu-satu ya~
                </span>
              </p>
              <div className="flex items-end justify-center gap-7">
                {[0, 1, 2].map((i) => {
                  const blown = blownCandles.includes(i);
                  return (
                    <button
                      key={i}
                      onClick={() => handleBlowCandle(i)}
                      disabled={blown}
                      aria-label={`Tiup lilin ${i + 1}`}
                      className="flex flex-col items-center gap-0 group cursor-pointer disabled:cursor-default"
                    >
                      <div className="relative h-11 flex items-end justify-center">
                        {!blown ? (
                          <Flame
                            size={28}
                            className="text-amber-300 animate-flame-flicker drop-shadow-[0_0_12px_rgba(252,211,77,0.85)] group-active:scale-90 transition-transform"
                            fill="currentColor"
                          />
                        ) : (
                          <span className="smoke-puff" />
                        )}
                      </div>
                      <div
                        className="w-3.5 h-14 rounded-sm shadow-inner"
                        style={{
                          background: blown
                            ? 'linear-gradient(to bottom, rgba(244,114,182,0.35), rgba(244,114,182,0.5))'
                            : 'linear-gradient(to bottom, #fbcfe8, #f472b6)',
                        }}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-white/50 text-xs">
                {blownCandles.length}/3 lilin ditiup
              </p>
            </div>
          )}

          {/* FINALE TAHAP 2: burst love singkat sebagai transisi dramatis */}
          {showFinale && finaleStage === 'burst' && (
            <div className="w-full flex flex-col items-center gap-3 py-2 animate-fade-in-up">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-pink-400/50 blur-2xl animate-pulse-glow" />
                <Heart
                  size={92}
                  className="relative text-pink-400 animate-heart-beat drop-shadow-[0_0_35px_rgba(244,114,182,0.8)]"
                  fill="currentColor"
                />
              </div>
              <h2 className="text-white text-2xl sm:text-3xl font-black drop-shadow leading-snug">
                Selamat ulang tahun,{' '}
                <span className="bg-gradient-to-r from-pink-300 via-amber-200 to-purple-300 bg-clip-text text-transparent">
                  {namaDepan}!
                </span>
              </h2>
            </div>
          )}

          {/* FINALE TAHAP 3: kartu ucapan digital yang bisa didownload */}
          {showFinale && finaleStage === 'card' && (
            <div className="w-full flex flex-col items-center gap-4 py-2 animate-fade-in-up">
              <p className="text-white/90 text-sm font-semibold">
                Ini kartu ucapan spesial buat {namaDepan} 💌
              </p>

              <div className="w-full max-w-[260px] rounded-2xl overflow-hidden border-2 border-pink-300/60 shadow-2xl bg-white/5">
                {cardDataUrl ? (
                  <img src={cardDataUrl} alt="Kartu ucapan ulang tahun" className="w-full h-auto block" />
                ) : (
                  <div className="aspect-[4/5] flex items-center justify-center">
                    <span className="text-white/60 text-sm">Menyiapkan kartu...</span>
                  </div>
                )}
              </div>

              {cardDataUrl && (
                <a
                  href={cardDataUrl}
                  download={`kartu-ulang-tahun-${namaDepan.toLowerCase()}.png`}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-300 hover:to-purple-300 text-white text-sm font-bold shadow-lg transition active:scale-95"
                >
                  <Download size={16} />
                  Unduh Kartu
                </a>
              )}
            </div>
          )}

          <button
            onClick={handleSkip}
            className="mt-1 px-6 py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-sm font-bold border border-white/30 transition active:scale-95"
          >
            {finaleStage === 'card' && showFinale ? 'Tutup ✨' : 'Terima kasih! 💜'}
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes bounce-soft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .animate-bounce-soft {
          animation: bounce-soft 1.6s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.15); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        @keyframes wiggle {
          0%, 100% { transform: rotate(-8deg) scale(1); }
          50% { transform: rotate(10deg) scale(1.15); }
        }
        .animate-wiggle {
          display: inline-block;
          animation: wiggle 1.4s ease-in-out infinite;
        }
        .animate-wiggle-delay {
          display: inline-block;
          animation: wiggle 1.4s ease-in-out infinite;
          animation-delay: 0.4s;
        }

        @keyframes gift-open {
          0% { transform: scale(1) rotate(0deg); opacity: 1; }
          40% { transform: scale(1.35) rotate(-10deg); }
          70% { transform: scale(1.15) rotate(6deg); }
          100% { transform: scale(0) rotate(0deg); opacity: 0; }
        }
        .animate-gift-open {
          animation: gift-open 0.7s ease-in forwards;
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }

        @keyframes bubble-in {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-bubble-in {
          animation: bubble-in 0.35s ease-out forwards;
        }

        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.85);
          animation: typing-bounce 1s infinite ease-in-out;
        }
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }

        .confetti-burst {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 8px;
          height: 8px;
          border-radius: 2px;
          animation: burst-fly 0.9s ease-out forwards;
        }
        @keyframes burst-fly {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) rotate(540deg);
            opacity: 0;
          }
        }

        .confetti-fall-loop {
          position: absolute;
          top: -20px;
          animation-name: fall-loop;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          opacity: 0.9;
        }
        @keyframes fall-loop {
          0% {
            transform: translateY(-5vh) rotate(var(--rot-start, 0deg));
            opacity: 0.9;
          }
          100% {
            transform: translateY(105vh) rotate(calc(var(--rot-start, 0deg) + 720deg));
            opacity: 0.6;
          }
        }

        .balloon-float {
          position: absolute;
          bottom: -80px;
          animation-name: balloon-rise;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        @keyframes balloon-rise {
          0% {
            transform: translateY(0) translateX(0) rotate(-4deg);
            opacity: 0;
          }
          10% { opacity: 0.9; }
          50% {
            transform: translateY(-55vh) translateX(20px) rotate(4deg);
          }
          90% { opacity: 0.8; }
          100% {
            transform: translateY(-115vh) translateX(-10px) rotate(-4deg);
            opacity: 0;
          }
        }

        .emoji-drift {
          position: absolute;
          animation-name: drift;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          filter: drop-shadow(0 0 6px rgba(255,255,255,0.3));
        }
        @keyframes drift {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.6; }
          50% { transform: translateY(-18px) rotate(8deg); opacity: 1; }
        }

        /* ===== Kembang api meletus-letus ===== */
        .firework-wrap {
          position: absolute;
          width: 0;
          height: 0;
          animation-name: firework-cycle-noop;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes firework-cycle-noop {
          0%, 100% { opacity: 1; }
        }

        .firework-flash {
          position: absolute;
          top: 0;
          left: 0;
          width: 14px;
          height: 14px;
          margin: -7px;
          border-radius: 50%;
          animation-name: firework-flash-pop;
          animation-timing-function: ease-out;
          animation-iteration-count: infinite;
          box-shadow: 0 0 14px 4px currentColor;
        }
        @keyframes firework-flash-pop {
          0% { transform: scale(0); opacity: 0; }
          8% { transform: scale(1.6); opacity: 1; }
          22% { transform: scale(0.4); opacity: 0; }
          100% { transform: scale(0.4); opacity: 0; }
        }

        .firework-particle {
          position: absolute;
          top: 0;
          left: 0;
          width: 5px;
          height: 5px;
          margin: -2.5px;
          border-radius: 50%;
          transform: rotate(var(--angle)) translateX(0);
          animation-name: firework-particle-move;
          animation-timing-function: cubic-bezier(0.15, 0.6, 0.4, 1);
          animation-iteration-count: infinite;
        }
        @keyframes firework-particle-move {
          0% {
            opacity: 0;
            transform: rotate(var(--angle)) translateX(0) scale(1);
          }
          8% {
            opacity: 1;
          }
          26% {
            opacity: 1;
            transform: rotate(var(--angle)) translateX(var(--dist)) scale(0.5);
          }
          45%, 100% {
            opacity: 0;
            transform: rotate(var(--angle)) translateX(var(--dist)) scale(0.3);
          }
        }

        /* ===== Finale: love besar berdetak + ornamen love kecil ===== */
        @keyframes heart-beat {
          0%, 100% { transform: scale(1); }
          15% { transform: scale(1.18); }
          30% { transform: scale(0.96); }
          45% { transform: scale(1.12); }
          60% { transform: scale(1); }
        }
        .animate-heart-beat {
          animation: heart-beat 1.3s ease-in-out infinite;
        }

        .love-float {
          position: absolute;
          bottom: -40px;
          animation-name: love-rise;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          filter: drop-shadow(0 0 6px rgba(244,114,182,0.5));
        }
        @keyframes love-rise {
          0% {
            transform: translateY(0) translateX(0) rotate(-6deg) scale(0.8);
            opacity: 0;
          }
          12% { opacity: 1; }
          55% {
            transform: translateY(-60vh) translateX(14px) rotate(6deg) scale(1.05);
          }
          88% { opacity: 0.85; }
          100% {
            transform: translateY(-100vh) translateX(-8px) rotate(-6deg) scale(0.9);
            opacity: 0;
          }
        }
        /* ===== Lilin: api berkedip + asap ngepul saat ditiup ===== */
        @keyframes flame-flicker {
          0%, 100% { transform: scale(1) rotate(-2deg); opacity: 1; }
          25% { transform: scale(1.08) rotate(2deg); opacity: 0.9; }
          50% { transform: scale(0.94) rotate(-3deg); opacity: 1; }
          75% { transform: scale(1.05) rotate(1deg); opacity: 0.95; }
        }
        .animate-flame-flicker {
          animation: flame-flicker 0.9s ease-in-out infinite;
        }

        .smoke-puff {
          display: block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.55);
          filter: blur(2px);
          animation: smoke-rise 0.9s ease-out forwards;
        }
        @keyframes smoke-rise {
          0% { transform: translateY(0) scale(0.6); opacity: 0.8; }
          100% { transform: translateY(-26px) scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
