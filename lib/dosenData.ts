// ================================================================
//  DATA DOSEN FAPERTA UPN "VETERAN" JAWA TIMUR
//  Sumber nama: faperta.upnjatim.ac.id/daftar-dosen/
//  Sumber No. HP: Dokumen resmi Faperta UPN Jatim
//  Last updated: Juli 2026
// ================================================================

export interface Dosen {
  nama: string;
  jabatanFungsional: string;
  jabatanStruktural: string;
  prodi: string;
  email: string;
  wa: string;
}

export const dataDosen: Dosen[] = [
  // ─── PIMPINAN FAKULTAS ───────────────────────────────────────
  { nama: "Dr. Ir. Wanti Mindari, M.P.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Dekan", prodi: "Agroteknologi", email: "wanti_m@upnjatim.ac.id", wa: "089602491123" },
  { nama: "Dr. F. Deru Dewanti, S.P., M.P.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Wakil Dekan I", prodi: "Agribisnis", email: "fderu_d@upnjatim.ac.id", wa: "081515301551" },
  { nama: "Dr. Ir. Sri Wiyatiningsih, M.P.", jabatanFungsional: "Lektor", jabatanStruktural: "Wakil Dekan II / PLT Sekretaris Jurusan Agribisnis", prodi: "Agribisnis", email: "sri.wiyatiningsih@upnjatim.ac.id", wa: "082125504277" },
  { nama: "Dr. Ir. Maroeto, M.P.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Wakil Dekan III", prodi: "Agroteknologi", email: "maroeto_08@yahoo.com", wa: "085236290960" },

  // ─── KEPALA JURUSAN / KOORDINATOR PRODI ──────────────────────
  { nama: "Prof. Dr. Ir. Syarif Imam Hidayat, M.M.", jabatanFungsional: "Guru Besar", jabatanStruktural: "Kepala Jurusan Agribisnis", prodi: "Agribisnis", email: "syarifimamhidayat@yahoo.com", wa: "081553895527" },
  { nama: "Dr. Ir. Bakti Wisnu Widjajani, M.P.", jabatanFungsional: "Lektor", jabatanStruktural: "Kepala Jurusan Agroteknologi", prodi: "Agroteknologi", email: "wisnuwidjajani@upnjatim.ac.id", wa: "085748845656" },
  { nama: "Ir. Moch Arifin, M.T.", jabatanFungsional: "Lektor", jabatanStruktural: "Sekretaris Jurusan Agroteknologi", prodi: "Agroteknologi", email: "arifin.agro@upnjatim.ac.id", wa: "085648382390" },
  { nama: "Dr. Ir. Nuriah Yuliati, M.P.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Koor Prodi S1 Agribisnis", prodi: "Agribisnis", email: "nuriah_y@upnjatim.ac.id", wa: "087853550353" },
  { nama: "Dr. Ir. Mubarokah, M.T.", jabatanFungsional: "Lektor", jabatanStruktural: "Koor Prodi S2 Agribisnis", prodi: "Agribisnis", email: "mubarokah@upnjatim.ac.id", wa: "082118999876" },
  { nama: "Dr. Ir. Hamidah Hendrarini, M.Si.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Koor Prodi S3 Agribisnis", prodi: "Agribisnis", email: "hamidah_h@upnjatim.ac.id", wa: "082232235000" },
  { nama: "Dr. Ir. Tri Mujoko, M.P.", jabatanFungsional: "Lektor", jabatanStruktural: "Koor Prodi S1 Agroteknologi", prodi: "Agroteknologi", email: "trimujo.agri@upnjatim.ac.id", wa: "08885236794" },
  { nama: "Dr. Ir. Penta Suryaminarsih, M.P.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Koor Prodi S2 Agroteknologi", prodi: "Agroteknologi", email: "penta_s@upnjatim.ac.id", wa: "081357261007" },

  // ─── GURU BESAR ───────────────────────────────────────────────
  { nama: "Prof. Dr. Ir. Teguh Soedarto, M.P.", jabatanFungsional: "Guru Besar", jabatanStruktural: "Dosen Tetap", prodi: "Agribisnis", email: "teguh_soedarto@upnjatim.ac.id", wa: "0818330119" },
  { nama: "Prof. Dr. Ir. Sri Tjondro Winarno, M.M.", jabatanFungsional: "Guru Besar", jabatanStruktural: "Dosen Tetap", prodi: "Agribisnis", email: "sritjondro_w@upnjatim.ac.id", wa: "082231347272" },
  { nama: "Prof. Dr. Ir. Juli Santoso, M.P.", jabatanFungsional: "Guru Besar", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "julisantoso@upnjatim.ac.id", wa: "08123224601" },
  { nama: "Prof. Dr. Ir. Moch. Sodiq.", jabatanFungsional: "Guru Besar", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "hmochsodiq@gmail.com", wa: "08121703893" },

  // ─── DOSEN TETAP ─────────────────────────────────────────────
  { nama: "Ir. Hadi Suhardjono, M.Tp.", jabatanFungsional: "Lektor", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "h_suhardjono@upnjatim.ac.id", wa: "08121700410" },
  { nama: "Ir. Didik Utomo Pribadi, M.P.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "didikutomo_mp@yahoo.com", wa: "08121625553" },
  { nama: "Ir. Widiwurjani, M.P.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "widiwurjani@upnjatim.ac.id", wa: "085731616034" },
  { nama: "Dr. Dra. Sutini, M.Pd.", jabatanFungsional: "Lektor", jabatanStruktural: "Dosen Tetap", prodi: "Umum", email: "tien.basuki@gmail.com", wa: "08123503771" },
  { nama: "Ir. Rr. Djarwatiningsih P.S., M.P.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "djarwatiningsihps@gmail.com", wa: "087751281738" },
  { nama: "Dr. Ir. Pangesti Nugrahani, M.Si.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "pangesti_n@upnjatim.ac.id", wa: "08113393361" },
  { nama: "Nova Triani, S.P., M.P.", jabatanFungsional: "Lektor", jabatanStruktural: "Dosen Tetap", prodi: "Agribisnis", email: "novatriani.agrotek@upnjatim.ac.id", wa: "081615451424" },
  { nama: "Dr. Ir. Yonny Koentjoro, M.M.", jabatanFungsional: "Lektor", jabatanStruktural: "Dosen Tetap", prodi: "Agribisnis", email: "yonny_k@upnjatim.ac.id", wa: "0817586978" },
  { nama: "Dr. Ir. Makhziah, M.P.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "makhziah.agro@upnjatim.ac.id", wa: "081358446745" },
  { nama: "Dr. Ir. Ida Retno Moeljani, M.P.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Dosen Tetap", prodi: "Agribisnis", email: "idarm.upnjatim@gmail.com", wa: "081284524942" },
  { nama: "Dr. Ir. Ramdan Hidayat, M.S.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "ramdan_h@upnjatim.ac.id", wa: "087851204070" },
  { nama: "Ir. Agus Sulistyono, M.P.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "sulistyonoagus112@gmail.com", wa: "08155118449" },
  { nama: "Dr. Ir. RA. Nora Augustien K., M.P.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "nora_a@upnjatim.ac.id", wa: "081330163359" },
  { nama: "Ir. Guniarti, M.M.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "guniarti@upnjatim.ac.id", wa: "081259207264" },
  { nama: "Dr. Ir. Sukendah, M.Sc.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "sukendah@upnjatim.ac.id", wa: "082333326107" },
  { nama: "Dr. Ir. Bambang Prijanto, M.S.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "bambangp945@gmail.com", wa: "081553472105" },
  { nama: "Dr. Ir. Herry Nirwanto, M.P.", jabatanFungsional: "Lektor", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "herry_n@upnjatim.ac.id", wa: "081358439720" },
  { nama: "Dr. Ir. Wiwin Windriyanti, M.P.", jabatanFungsional: "Lektor", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "winfie2202@gmail.com", wa: "081334349089" },
  { nama: "Drh. Wiludjeng Widajati, M.P.", jabatanFungsional: "Lektor", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "wiludjeng@upnjatim.ac.id", wa: "081357746406" },
  { nama: "Dr. Ir. Yenny Wuryandari, M.P.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "yennywuryandari@upnjatim.ac.id", wa: "085852420123" },
  { nama: "Dr. Dra. Endang Tri Wahyu Prasetyawati, M.Si.", jabatanFungsional: "Lektor", jabatanStruktural: "Dosen Tetap", prodi: "Umum", email: "endang_tp@upnjatim.ac.id", wa: "081332993179" },
  { nama: "Noni Rahmadhini, S.P., M.Sc.", jabatanFungsional: "Asisten Ahli", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "nonirahmadhini.agrotek@upnjatim.ac.id", wa: "082240534918" },
  { nama: "Dita Megasari, S.P., M.Si.", jabatanFungsional: "Tenaga Pengajar", jabatanStruktural: "Dosen Tetap", prodi: "Agribisnis", email: "", wa: "085285018051" },
  { nama: "Dr. Ir. Rossyda Priyadarshini, M.P.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "priyadarshinirossyda@gmail.com", wa: "08123166335" },
  { nama: "Ir. Kemal Wijaya, M.T.", jabatanFungsional: "Lektor", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "kemwijaya@upnjatim.ac.id", wa: "08123519483" },
  { nama: "Ir. Siswanto, M.T.", jabatanFungsional: "Lektor", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "siswanto.agro@upnjatim.ac.id", wa: "081330422863" },
  { nama: "Ir. Purnomo Edi Sasongko, M.P.", jabatanFungsional: "Lektor", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "purnomoedis@gmail.com", wa: "081703113022" },
  { nama: "Ir. Supamrih, S.E., M.M.A.", jabatanFungsional: "Lektor", jabatanStruktural: "Dosen Tetap", prodi: "Agribisnis", email: "supamrih@upnjatim.ac.id", wa: "081231180569" },
  { nama: "Ir. Setyo Budi Santoso, M.P.", jabatanFungsional: "Lektor", jabatanStruktural: "Dosen Luar Biasa", prodi: "Agroteknologi", email: "setyogal.upn@gmail.com", wa: "081357361294" },
  { nama: "Ir. Purwadi, M.P.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "purwadi@upnjatim.ac.id", wa: "082141548017" },
  { nama: "Haidar Fari Aditya, S.P., M.P.", jabatanFungsional: "Asisten Ahli", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "", wa: "082139292905" },
  { nama: "Dewi Puspa Arum, S.Pd., M.Pd.", jabatanFungsional: "Lektor", jabatanStruktural: "Dosen Tetap", prodi: "Umum", email: "", wa: "082217002310" },
  { nama: "Puji Lestari Tarigan, S.P., M.Sc.", jabatanFungsional: "Tenaga Pengajar", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "", wa: "081275305073" },
  { nama: "Safira Rizka Lestari, S.P., M.P.", jabatanFungsional: "Tenaga Pengajar", jabatanStruktural: "Dosen Tetap", prodi: "Agribisnis", email: "", wa: "081239222776" },
  { nama: "Iis Purnamawati, S.P., M.Si.", jabatanFungsional: "Tenaga Pengajar", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "", wa: "085721070856" },
  { nama: "Ramadhani Mahendra Kusuma, S.P., M.P., M.Sc.", jabatanFungsional: "Tenaga Pengajar", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "", wa: "082228962005" },
  { nama: "Fitri Wijayanti, S.P., M.P.", jabatanFungsional: "Tenaga Pengajar", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "", wa: "085732215399" },
  { nama: "Saefurrohman, S.P., M.Sc.", jabatanFungsional: "Tenaga Pengajar", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "", wa: "081572584805" },
  { nama: "Ir. Sri Widayanti, M.P.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Dosen Tetap", prodi: "Agribisnis", email: "widayant123@yahoo.com", wa: "08123567834" },
  { nama: "Dr. Fazlul Rahman, Lc., M.A.Hum.", jabatanFungsional: "Lektor", jabatanStruktural: "Dosen Tetap", prodi: "Umum", email: "fazlulrahman85@gmail.com", wa: "082112146452" },
  { nama: "Dr. Ir. Indra Tjahaja Amir, M.P.", jabatanFungsional: "Lektor", jabatanStruktural: "Dosen Tetap", prodi: "Agribisnis", email: "indra_ta@upnjatim.ac.id", wa: "0898218311" },
  { nama: "Dr. Ir. Eko Nurhadi, M.S.", jabatanFungsional: "Lektor", jabatanStruktural: "Dosen NIDK", prodi: "Agribisnis", email: "ekonhadi@yahoo.com", wa: "08123502912" },
  { nama: "Laksmi Diana, S.S., M.Pd.", jabatanFungsional: "Asisten Ahli", jabatanStruktural: "Dosen Tetap", prodi: "Umum", email: "laksmidiana.agribis@upnjatim.ac.id", wa: "081230484435" },
  { nama: "Dr. Ir. Arika Purnawati, M.P.", jabatanFungsional: "Lektor", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "", wa: "" },
  { nama: "Ir. Setyo Parsudi, M.P.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Dosen Luar Biasa", prodi: "Agribisnis", email: "", wa: "" },
  { nama: "Dr. Ir. Taufiq Setyadi, M.P.", jabatanFungsional: "Tenaga Pengajar", jabatanStruktural: "Dosen NIDK", prodi: "Agroteknologi", email: "", wa: "" },
  { nama: "Gyska Indah, S.P., M.Agr.", jabatanFungsional: "Asisten Ahli", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "", wa: "" },
  { nama: "Wahyu Santoso, S.P., M.M.A.", jabatanFungsional: "Asisten Ahli", jabatanStruktural: "Dosen Tetap", prodi: "Agribisnis", email: "", wa: "" },
  { nama: "Dr. Ir. Pawana Nur Indah, M.Si.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Dosen NIDK", prodi: "Agribisnis", email: "", wa: "" },
  { nama: "Dr. Ir. Endang Yektiningsih, M.P.", jabatanFungsional: "Lektor Kepala", jabatanStruktural: "Dosen NIDK", prodi: "Agribisnis", email: "", wa: "" },
  { nama: "Ir. Sigit Dwi Nugroho, M.Si.", jabatanFungsional: "Lektor", jabatanStruktural: "Dosen Tetap", prodi: "Agribisnis", email: "", wa: "" },
  { nama: "Ir. Eko Priyanto, M.P.", jabatanFungsional: "Asisten Ahli", jabatanStruktural: "Dosen Tetap", prodi: "Agribisnis", email: "", wa: "" },
  { nama: "Fatchur Rozci, S.P., M.Agr.", jabatanFungsional: "Tenaga Pengajar", jabatanStruktural: "Dosen Tetap", prodi: "Agribisnis", email: "", wa: "" },
  { nama: "Dr. Dona Wahyuning Laily, S.P., M.P.", jabatanFungsional: "Asisten Ahli", jabatanStruktural: "Dosen Tetap", prodi: "Agribisnis", email: "", wa: "" },
  { nama: "Prasmita Dian Wijayati, S.P., M.Si.", jabatanFungsional: "Tenaga Pengajar", jabatanStruktural: "Dosen Tetap", prodi: "Agribisnis", email: "", wa: "" },
  { nama: "Dita Atasa, S.P., M.P.", jabatanFungsional: "Asisten Ahli", jabatanStruktural: "Dosen Tetap", prodi: "Agribisnis", email: "", wa: "" },
  { nama: "Dr. Noor Rizkiyah, S.P., M.P.", jabatanFungsional: "Asisten Ahli", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "", wa: "" },
  { nama: "Dr. Ida Syamsu Roidah, S.P., M.M.A.", jabatanFungsional: "Asisten Ahli", jabatanStruktural: "Dosen Tetap", prodi: "Agribisnis", email: "", wa: "" },
  { nama: "Risqi Firdaus Setiawan, S.P., M.P.", jabatanFungsional: "Tenaga Pengajar", jabatanStruktural: "Dosen Tetap", prodi: "Agribisnis", email: "", wa: "" },
  { nama: "Mirza Andrian Syah, S.P., M.P.", jabatanFungsional: "Tenaga Pengajar", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "", wa: "" },
  { nama: "Nisa Hafi Idhoh Fitriana, S.P., M.P.", jabatanFungsional: "Tenaga Pengajar", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "", wa: "" },
  { nama: "Ika Sari Tondang, S.P., M.Sc.", jabatanFungsional: "Tenaga Pengajar", jabatanStruktural: "Dosen Tetap", prodi: "Agroteknologi", email: "", wa: "" },
  { nama: "Fadila Suryandika, S.T.P., M.Sc.", jabatanFungsional: "Tenaga Pengajar", jabatanStruktural: "Dosen Tetap", prodi: "Agribisnis", email: "", wa: "" },
];

/**
 * Cari dosen berdasarkan kata kunci (nama, jabatan, prodi, atau email).
 * Pencarian tidak case-sensitive dan partial match.
 */
export function cariDosen(keyword: string): Dosen[] {
  const kw = keyword.toLowerCase().trim();
  return dataDosen.filter(
    (d) =>
      d.nama.toLowerCase().includes(kw) ||
      d.jabatanStruktural.toLowerCase().includes(kw) ||
      d.jabatanFungsional.toLowerCase().includes(kw) ||
      d.prodi.toLowerCase().includes(kw) ||
      d.email.toLowerCase().includes(kw)
  );
}