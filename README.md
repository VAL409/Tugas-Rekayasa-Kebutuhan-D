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
| **Functional Suitability** (Fungsionalitas) | Menambahkan data alumni baru melalui Modal Form. | Data baru berhasil ditambahkan ke antrean dengan status *default* "Belum Dilacak". | ✅ Pass | Fungsi `simpanDataBaru()` berjalan dengan baik dan angka dashboard ter-update. |
| **Functional Suitability** | Menjalankan *Job Pelacakan* pada data baru. | Sistem memberikan skor *random*, lalu mendistribusikan data ke status "Teridentifikasi" (>80), "Perlu Verifikasi" (60-80), atau "Tidak Ditemukan" (<60). | ✅ Pass | Algoritma *scoring* dan kondisi IF/ELSE berjalan sesuai algoritma *pseudocode*. |
| **Functional Suitability** | Memilih keputusan "Kandidat Valid" pada menu Verifikasi Manual. | Status data berubah menjadi "Teridentifikasi", skor menjadi 100, dan data pindah ke tabel Data Alumni. | ✅ Pass | Fungsi `prosesVerifikasi()` bekerja dengan baik menghapus antrean. |
| **Usability** (Kebergunaan) | Navigasi menu sidebar (Dashboard, Data Alumni, Pelacakan, Verifikasi). | Halaman berpindah secara instan tanpa perlu *reload browser* (SPA) dan tombol menu yang aktif berubah warna. | ✅ Pass | Manipulasi DOM `switchView()` berfungsi lancar. |
| **Usability** | Mencari nama atau NIM di halaman Data Alumni. | Tabel langsung menyaring dan menampilkan baris data yang relevan dengan karakter yang diketik pengguna. | ✅ Pass | Fungsi *real-time filtering* merespon ketikan dengan instan. |
| **Performance Efficiency** (Performa) | Merender data statistik pada 4 kartu utama di Dashboard. | Angka pada kartu (Total, Selesai, Antrean) langsung dikalkulasi dan di-render dalam hitungan milidetik setelah data diubah. | ✅ Pass | Penggunaan filter array bawaan JavaScript sangat cepat dan efisien. |

---

## 💻 Cara Menjalankan Aplikasi
1. *Clone repository* ini ke komputer lokal Anda.
2. Buka folder proyek.
3. Jalankan file `style.html` menggunakan *browser* (disarankan menggunakan ekstensi *Live Server* di VS Code untuk pengalaman terbaik).
4. Tidak memerlukan instalasi *library* tambahan (NPM/Node.js) karena aplikasi murni berjalan di sisi klien (Client-Side).
