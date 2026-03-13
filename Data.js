let dataAlumni = [
  { id: 1, nim: "201910370311001", nama: "Ahmad Fauzi", tahun_lulus: "2022", pekerjaan: "Software Engineer · Gojek, Jakarta", sumber: "LinkedIn", status: "Teridentifikasi", skor: 90 },
  { id: 2, nim: "201910370311042", nama: "Siti Rahayu", tahun_lulus: "2021", pekerjaan: "Peneliti · LIPI, Bandung", sumber: "Scholar", status: "Teridentifikasi", skor: 85 },
  { id: 3, nim: "201910370311077", nama: "Budi Santoso", tahun_lulus: "2020", pekerjaan: "1 kandidat ditemukan", sumber: "LinkedIn", status: "Perlu Verifikasi", skor: 75 },
  { id: 4, nim: "202210370311003", nama: "Dewi Lestari", tahun_lulus: "2023", pekerjaan: "-", sumber: "-", status: "Belum Dilacak" },
  { id: 5, nim: "202010370311088", nama: "Rizky Pratama", tahun_lulus: "2021", pekerjaan: "Tidak ditemukan", sumber: "-", status: "Tidak Ditemukan", skor: 15 }
];

let dataLogs = [
  { id: 1, nama: "Ahmad Fauzi", query: '"Ahmad Fauzi" + "UMM"', sumber: "LinkedIn", skor: 90, hasil: "Cocok" },
  { id: 2, nama: "Siti Rahayu", query: '"Siti Rahayu" site:scholar.google.com', sumber: "Scholar", skor: 85, hasil: "Cocok" },
  { id: 3, nama: "Budi Santoso", query: '"Budi Santoso" + "Informatika" + "UMM"', sumber: "LinkedIn", skor: 75, hasil: "Ambigu" },
  { id: 4, nama: "Rizky Pratama", query: '"Rizky Pratama" + "Software" + "Malang"', sumber: "Web", skor: 15, hasil: "Tidak Cocok" }
];

let kandidatVerifikasi = [
{
    id_alumni: 3, nama: "Budi Santoso", nim: "201910370311077", angkatan: "2020",
    kandidat: [
    { id_k: 1, sumber: "LinkedIn", nama: "Budi Santoso", jabatan: "Backend Dev · Telkom Indonesia", detail: "Malang, 2020", skor: 75 }
    ]
}
];

function getAlumni() { return dataAlumni; }
function getLogs() { return dataLogs; }
function getKandidat() { return kandidatVerifikasi; }