let dataAlumni = [
  { 
    id: 1, nim: "201910370311001", nama: "Ahmad Fauzi", tahun_lulus: "2022", 
    email: "ahmad.f@gojek.com", no_hp: "08123456789", 
    linkedin: "linkedin.com/in/ahmadfauzi", instagram: "@ahmad_f", facebook: "Ahmad Fauzi", tiktok: "-",
    tempat_bekerja: "Gojek", alamat_bekerja: "Jakarta", posisi: "Software Engineer", 
    status_pekerjaan: "Swasta", sosmed_tempat_bekerja: "linkedin.com/company/gojek",
    sumber: "LinkedIn", status: "Teridentifikasi", skor: 90 
  },
  { 
    id: 2, nim: "201910370311042", nama: "Siti Rahayu", tahun_lulus: "2021", 
    email: "siti.rahayu@lipi.go.id", no_hp: "08771234567", 
    linkedin: "linkedin.com/in/sitirahayu", instagram: "@siti_r", facebook: "Siti Rahayu", tiktok: "-",
    tempat_bekerja: "LIPI", alamat_bekerja: "Bandung", posisi: "Peneliti", 
    status_pekerjaan: "PNS", sosmed_tempat_bekerja: "-",
    sumber: "Scholar", status: "Teridentifikasi", skor: 85 
  },
  { 
    id: 3, nim: "201910370311077", nama: "Budi Santoso", tahun_lulus: "2020", 
    email: "", no_hp: "", 
    linkedin: "", instagram: "", facebook: "", tiktok: "",
    tempat_bekerja: "", alamat_bekerja: "", posisi: "", 
    status_pekerjaan: "", sosmed_tempat_bekerja: "",
    sumber: "LinkedIn", status: "Perlu Verifikasi", skor: 75 
  },
  { id: 4, nim: "202210370311003", nama: "Dewi Lestari", tahun_lulus: "2023", email: "", no_hp: "", linkedin: "", instagram: "", facebook: "", tiktok: "", tempat_bekerja: "", alamat_bekerja: "", posisi: "", status_pekerjaan: "", sosmed_tempat_bekerja: "", sumber: "-", status: "Belum Dilacak" },
  { id: 5, nim: "202010370311088", nama: "Rizky Pratama", tahun_lulus: "2021", email: "", no_hp: "", linkedin: "", instagram: "", facebook: "", tiktok: "", tempat_bekerja: "", alamat_bekerja: "", posisi: "", status_pekerjaan: "", sosmed_tempat_bekerja: "", sumber: "-", status: "Tidak Ditemukan", skor: 15 }
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