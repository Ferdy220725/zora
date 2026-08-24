"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
// ^ Sesuaikan path ini dengan lokasi supabase client-side kamu (yang sinkron,
//   bukan async createClient() untuk server component).

interface AbsensiMahasiswaProps {
  kelasId: string; // uuid dari tabel `kelas`, dipakai untuk query/insert ke tabel absensi
  kodeKelas?: string; // kode pendek kelas (dari URL [kode]), hanya untuk ditampilkan
  namaKelas?: string; // nama kelas, hanya untuk ditampilkan
}

// Daftar Mahasiswa tetap dipertahankan sesuai aslinya
const DAFTAR_MAHASISWA = [
  { npm: "25025010093", nama: "SITI NUR FADILAH" },
  { npm: "25025010094", nama: "AGNIA LAQUINTA AL-ABIN" },
  { npm: "25025010095", nama: "AFIA DWI AGUSTIN" },
  { npm: "25025010096", nama: "APRILITA MASYFATAH" },
  { npm: "25025010097", nama: "SYAKILA BALQIS AL-FANEZA" },
  { npm: "25025010098", nama: "AULIA EKA SAITRI" },
  { npm: "25025010099", nama: "CALLISTA ZAHRATUNISSA" },
  { npm: "25025010100", nama: "AHMAT CHOYRUL FERDYANSYAH" },
  { npm: "25025010101", nama: "DHEA FITRI RAMADHANI" },
  { npm: "25025010102", nama: "ALIEF RAHMAT AKBARANI" },
  { npm: "25025010103", nama: "KARISMA ZAHRA LAILATUL FUADAH" },
  { npm: "25025010104", nama: "JAZZICA AZZURRA ANINDYA ZANDRA" },
  { npm: "25025010105", nama: "ENDYATMA ADRIEL FABIAN DAVID" },
  { npm: "25025010106", nama: "RIZQI SURYA PRATAMA" },
  { npm: "25025010107", nama: "ANNISA AULIA RAMADANI" },
  { npm: "25025010108", nama: "EKA RISZIANA AGUSTIN" },
  { npm: "25025010109", nama: "KHULLATUL BARIROH" },
  { npm: "25025010110", nama: "AGATHA ZULEYKA RAMDAN" },
  { npm: "25025010111", nama: "FAQIHATUN NISA'" },
  { npm: "25025010112", nama: "SALSABILLA OCTAVIA RAMADHANI" },
  { npm: "25025010113", nama: "KEYSHA AULIA AZZAHRA" },
  { npm: "25025010114", nama: "ANGEL MONICA NH" },
  { npm: "25025010115", nama: "USWATUN KHASANAH" },
  { npm: "25025010116", nama: "DHARMA AJI WISNU UTAMA" },
  { npm: "25025010117", nama: "KEIKY RESVANTI RAMADHANTI" },
  { npm: "25025010118", nama: "ANDINI SALWA INGRAINI" },
  { npm: "25025010119", nama: "TALITHA LISTYA SALSABILA" },
  { npm: "25025010120", nama: "ANDREA BENAYA PAGONGGANG" },
  { npm: "25025010121", nama: "AQDRIA YASHIRLY AMIRILA" },
  { npm: "25025010122", nama: "MOHAMMAD RIZKY HIKMAL PRAWIRA" },
  { npm: "25025010123", nama: "SAFRINA BR TINJAK" },
  { npm: "25025010124", nama: "CITRA PUTRI RAHMADANY" },
  { npm: "25025010125", nama: "ARJUNA WIRA KUSUMA" },
  { npm: "25025010126", nama: "NADIA FEBRISCA RACHMA" },
  { npm: "25025010127", nama: "KHANZA AFIFAH AMALINA" },
  { npm: "25025010128", nama: "FARINA PUTRI AURELIA" },
  { npm: "25025010129", nama: "M. FAREL AL FAHREZI" },
  { npm: "25025010130", nama: "LILIS DWI NURFADILAH" },
  { npm: "25025010131", nama: "AGNIA ALYA PUTRI" },
  { npm: "25025010132", nama: "CIKA RAHMA DWI ANJARSARI" },
  { npm: "25025010133", nama: "MARCELLY ELZA VARODIES" },
  { npm: "25025010134", nama: "MUHAMMAD DAFFA ABYANSYAH" },
  { npm: "25025010135", nama: "RAFINES AL MUSLIM" },
  { npm: "25025010137", nama: "SONYA DAMAYANTI AZ-ZAHARA" },
  { npm: "25025010138", nama: "PRATIWI CITRA OKTAVIA" },
];

// npm -> waktu_absen (ISO string) untuk yang sudah absen hari ini
type PetaAbsen = Record<string, string>;

export default function AbsensiMahasiswa({
  kelasId,
  kodeKelas,
  namaKelas,
}: AbsensiMahasiswaProps) {
  const supabase = createClient();

  const [sudahAbsen, setSudahAbsen] = useState<PetaAbsen>({});
  const [isLoadingAwal, setIsLoadingAwal] = useState(true);
  const [npmDiproses, setNpmDiproses] = useState<string | null>(null);
  const [pesan, setPesan] = useState<{ tipe: "sukses" | "error"; teks: string } | null>(
    null
  );

  // Muat data absensi hari ini untuk kelas ini saat komponen dibuka
  useEffect(() => {
    const muatAbsensiHariIni = async () => {
      const mulaiHariIni = new Date();
      mulaiHariIni.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("absensi")
        .select("npm, waktu_absen")
        .eq("kelas_id", kelasId)
        .gte("waktu_absen", mulaiHariIni.toISOString());

      if (!error && data) {
        const peta: PetaAbsen = {};
        data.forEach((row: { npm: string; waktu_absen: string }) => {
          peta[row.npm] = row.waktu_absen;
        });
        setSudahAbsen(peta);
      }
      setIsLoadingAwal(false);
    };

    muatAbsensiHariIni();
  }, [kelasId, supabase]);

  const handleAbsen = async (npm: string, nama: string) => {
    setNpmDiproses(npm);
    setPesan(null);

    const { data, error } = await supabase
      .from("absensi")
      .insert({
        nama_mahasiswa: nama,
        npm,
        kelas_id: kelasId,
      })
      .select("waktu_absen")
      .single();

    setNpmDiproses(null);

    if (error) {
      setPesan({
        tipe: "error",
        teks: `Gagal mencatat absen ${nama}: ${error.message}`,
      });
      return;
    }

    setSudahAbsen((prev) => ({ ...prev, [npm]: data.waktu_absen as string }));
    setPesan({ tipe: "sukses", teks: `${nama} berhasil absen.` });
  };

  const formatJam = (iso: string) =>
    new Date(iso).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const jumlahSudahAbsen = Object.keys(sudahAbsen).length;

  return (
    <div className="w-full">
      {(namaKelas || kodeKelas) && (
        <div className="mb-2">
          {namaKelas && (
            <h2 className="text-lg font-semibold text-gray-800">{namaKelas}</h2>
          )}
          {kodeKelas && (
            <p className="text-sm text-gray-500">Kode kelas: {kodeKelas}</p>
          )}
        </div>
      )}

      <div className="mb-3 text-sm text-gray-600">
        {isLoadingAwal
          ? "Memuat data absensi..."
          : `${jumlahSudahAbsen} dari ${DAFTAR_MAHASISWA.length} mahasiswa sudah absen hari ini.`}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-600">No</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">NPM</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Nama</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {DAFTAR_MAHASISWA.map((mhs, idx) => {
              const waktu = sudahAbsen[mhs.npm];
              const sedangDiproses = npmDiproses === mhs.npm;

              return (
                <tr key={mhs.npm}>
                  <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-2 font-mono text-gray-700">{mhs.npm}</td>
                  <td className="px-4 py-2 text-gray-800">{mhs.nama}</td>
                  <td className="px-4 py-2">
                    {waktu ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-green-700 text-xs font-medium">
                        Hadir · {formatJam(waktu)}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAbsen(mhs.npm, mhs.nama)}
                        disabled={sedangDiproses || isLoadingAwal}
                        className="rounded-md bg-blue-600 px-3 py-1.5 text-white text-xs font-medium disabled:opacity-50 hover:bg-blue-700 transition"
                      >
                        {sedangDiproses ? "Menyimpan..." : "Absen"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pesan && (
        <div
          className={`mt-3 text-sm ${
            pesan.tipe === "sukses" ? "text-green-600" : "text-red-600"
          }`}
        >
          {pesan.teks}
        </div>
      )}
    </div>
  );
}