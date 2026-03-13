# Sistem Pelacakan Alumni Publik

Sistem Pelacakan Alumni Publik adalah aplikasi berbasis web (Single Page Application) yang dirancang untuk membantu pihak universitas dalam melacak jejak karir alumni secara otomatis melalui berbagai sumber publik seperti LinkedIn, Google Scholar, dan Web Publik.

**Identitas Pengembang:**
- **Nama:** Reyvaldi Febryan Widya Utomo
- **NIM:** 202310370311409
- **Kelas:** Rekayasa Kebutuhan D

---

## 🚀 Fitur Utama
1. **Dashboard Statistik:** Menampilkan ringkasan total lulusan, data teridentifikasi, antrean verifikasi, dan data yang belum ditemukan secara *real-time*.
2. **Data Alumni:** Tabel daftar alumni yang sudah melalui proses pelacakan beserta status validasinya. Dilengkapi dengan fitur pencarian interaktif.
3. **Job Pelacakan:** Sistem simulasi *scoring* (Disambiguasi) untuk mencocokkan kesesuaian data berdasarkan Afiliasi, Tahun Lulus, dan Bidang.
4. **Verifikasi Manual:** Modul khusus bagi Admin Kampus untuk meninjau data kandidat yang bersifat ambigu (Skor 60-80) guna dikonfirmasi kebenarannya.

---

## 🛠️ Teknologi yang Digunakan
- **HTML5** (Struktur Halaman)
- **Tailwind CSS** via CDN (Styling dan UI/UX)
- **Vanilla JavaScript** (DOM Manipulation & Simulasi Logika *Scoring*)
- **FontAwesome** (Ikon)

---

## 🧪 Pengujian Sistem (Berdasarkan Aspek Kualitas)

Berikut adalah hasil pengujian aplikasi berdasarkan aspek kualitas perangkat lunak yang telah ditentukan pada desain *Daily Project 2*:

| Aspek Kualitas | Skenario Pengujian (Test Case) | Hasil yang Diharapkan (Expected Result) | Status | Keterangan |
| :--- | :--- | :--- | :---: | :--- |
| **Functional Suitability** | Melakukan otentikasi Login sebagai Admin Kampus. | Sistem memvalidasi kredensial dan mengarahkan pengguna ke halaman Dashboard. | ✅ Pass | Pengguna memasukkan akun *default* (Username: `admin`, Password: `admin123`) pada form login dan berhasil masuk ke dalam sistem utama. |
| **Functional Suitability** | Menambahkan data alumni baru melalui Modal Form. | Data berhasil ditambahkan dan masuk ke dalam antrean pelacakan dengan status *default* "Belum Dilacak". | ✅ Pass | Admin mengisi form (Nama, NIM, Tahun). Setelah disimpan, data belum masuk ke tabel Data Alumni, melainkan diarahkan terlebih dahulu ke halaman antrean "Job Pelacakan". |
| **Functional Suitability** | Menjalankan tombol *Jalankan Job Sekarang* pada halaman Pelacakan. | Sistem memproses antrean data baru, menghitung skor kecocokan, dan menetapkan status akhir. | ✅ Pass | **Sesuai alur logika:** Jika skor **> 80** otomatis langsung berstatus *Teridentifikasi*. Jika skor berada di antara **60 - 80**, data akan dialihkan ke menu *Verifikasi Manual*. Jika skor **< 60**, otomatis menjadi *Tidak Ditemukan* (tidak valid). |
| **Functional Suitability** | Meninjau data ambigu pada halaman Verifikasi Manual. | Admin dapat memeriksa detail kandidat dan memberikan keputusan akhir (Valid/Tidak Cocok). | ✅ Pass | Admin mengecek data alumni dengan skor 60-80. Jika diklik "Kandidat Valid", skor menjadi 100 dan status finalnya menjadi *Teridentifikasi* lalu masuk ke Data Alumni yang sudah dilacak. |
| **Usability** | Menggunakan navigasi Sidebar dan mencari data pada kolom Search. | Halaman berpindah secara instan (SPA) dan tabel menampilkan hasil spesifik dari kata kunci (Nama/NIM). | ✅ Pass | Alur UI sangat mulus tanpa perlu *reload* halaman (*Single Page Application*). Kolom pencarian memfilter baris data secara *real-time* sesuai ketikan admin. |
| **Performance Efficiency** | Merender ulang kalkulasi angka dan tabel (Refresh UI). | Angka pada kartu (Total, Selesai, Antrean) langsung dikalkulasi ulang setiap ada aksi penambahan/validasi. | ✅ Pass | Penggunaan filter *array* bawaan JavaScript mengeksekusi hitungan dan render DOM dalam hitungan milidetik secara efisien. |

---

## 💻 Cara Menjalankan Aplikasi
1. *Clone repository* ini ke komputer lokal Anda.
2. Buka folder proyek.
3. Jalankan file `index.html` menggunakan *browser*.
4. Setelah login, aplikasi akan menuju ke `Dashboard.html`.
5. Tidak memerlukan instalasi *library* tambahan (NPM/Node.js) karena aplikasi murni berjalan di sisi klien.
