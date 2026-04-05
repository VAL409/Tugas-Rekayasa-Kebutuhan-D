const SUPABASE_URL = 'https://dcdxrcqqlliujcniufoh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjZHhyY3FxbGxpdWpjbml1Zm9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyODk3OTYsImV4cCI6MjA5MDg2NTc5Nn0.TC4TGI05ab5BR8jIrUTPUZWcUIejwmUVPGoHxi0ss4A';
const SPREADSHEET_API_URL = 'https://script.google.com/macros/s/AKfycbwkk5vnJiifQDni34CoLzHkSPjXew7fd-xPCEV6t92gytVmKiBaZs14x9le6g2dodHD/exec';
const CSV_ALUMNI_URL = 'alumni.csv';
const CSV_LOGS_URL = 'logs.csv';
const CSV_KANDIDAT_URL = 'kandidat.csv';
const DEFAULT_ALUMNI_LIMIT = 10;
const TRACKING_BATCH_SIZE = 20;
let alumniCache = null;
let logsCache = null;
let kandidatCache = null;
let isHapusMode = false;
let currentPageDataAlumni = 1;

function persistData() {
  localStorage.setItem('alumni_cache', JSON.stringify(alumniCache));
  localStorage.setItem('logs_cache', JSON.stringify(logsCache));
  localStorage.setItem('kandidat_cache', JSON.stringify(kandidatCache));
}

async function ensureSupabase() {
  if (window.supabaseClient) return window.supabaseClient;
  if (!window.supabase) {
    console.warn('Supabase library tidak tersedia. Pastikan <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> sudah dimuat.');
    return null;
  }
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  return window.supabaseClient;
}

function parseCsvText(csvText) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const next = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      rows[rows.length - 1].push(current);
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') continue;
      if (!rows.length) rows.push([]);
      rows[rows.length - 1].push(current);
      current = '';
      rows.push([]);
      continue;
    }

    if (!rows.length) rows.push([]);
    current += char;
  }

  if (current !== '' || (rows.length && rows[rows.length - 1].length)) {
    if (!rows.length) rows.push([]);
    rows[rows.length - 1].push(current);
  }

  return rows.filter(row => row.length > 0 || row.some(cell => cell !== ''));
}

function parseCsvResponse(text, fields) {
  const rows = parseCsvText(text.trim());
  if (!rows.length) return [];

  const firstRow = rows[0];
  const hasHeader = firstRow.length === fields.length && firstRow.every((cell, index) => {
    const header = String(cell).toLowerCase().replace(/\s+/g, '');
    return header.includes(fields[index].toLowerCase().replace(/_/g, '')) || fields[index].toLowerCase().replace(/_/g, '').includes(header);
  });

  const dataRows = hasHeader ? rows.slice(1) : rows;
  return dataRows.map(row => fields.reduce((obj, key, index) => {
    obj[key] = row[index] !== undefined ? row[index] : '';
    return obj;
  }, {}));
}

async function fetchSpreadsheetData(limit = 10) {
  try {
    console.log(`Mengambil ${limit} data dari Spreadsheet API...`);
    const url = `${SPREADSHEET_API_URL}?limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    const normalized = normalizeSheetRows(result, SHEET_ALUMNI_FIELDS);
    
    // Map data agar sesuai dengan kebutuhan aplikasi (tambahkan ID, status default, dll)
    return normalized.map(item => ({
      ...item,
      id: item.id || item.nim || `sp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      status: item.status || 'Belum Dilacak',
      sumber: item.sumber || 'Spreadsheet',
      skor: item.skor || ''
    }));
  } catch (error) {
    console.error('Gagal mengambil data dari Spreadsheet API:', error);
    return null;
  }
}

async function loadCsvData(url, fields) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    return parseCsvResponse(text, fields);
  } catch (error) {
    console.error(`Gagal memuat CSV ${url}:`, error);
    return [];
  }
}

const SHEET_ALUMNI_FIELDS = ['nama', 'nim', 'tahun_masuk', 'tanggal_lulus', 'fakultas', 'prodi'];

function normalizeSheetRows(response, fields) {
  const rows = Array.isArray(response)
    ? response
    : response && Array.isArray(response.data)
      ? response.data
      : response && Array.isArray(response.values)
        ? response.values
        : null;

  if (!rows || !Array.isArray(rows)) return response;
  if (!rows.length) return [];

  // If the first row contains header labels, skip it.
  const firstRow = rows[0];
  const isHeaderRow = Array.isArray(firstRow) && firstRow.every((cell, idx) => typeof cell === 'string' && cell.toLowerCase().includes(fields[idx]?.toLowerCase().replace('_', '')));
  const effectiveRows = isHeaderRow ? rows.slice(1) : rows;

  if (!effectiveRows.length || !Array.isArray(effectiveRows[0])) return effectiveRows;

  return effectiveRows.map(row => {
    if (!Array.isArray(row)) return row;
    return fields.reduce((obj, key, index) => {
      obj[key] = row[index];
      return obj;
    }, {});
  });
}

function parseCandidateField(value) {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

async function checkAuth() {
  const supabase = await ensureSupabase();
  if (!supabase) {
    alert('Supabase tidak tersedia. Silakan kembali ke halaman login.');
    window.location.href = 'index.html';
    return;
  }
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      window.location.href = 'index.html';
      return null;
    }
    
    // Sinkronisasi data user dari session ke UI Dashboard
    const user = session.user;
    const displayName = user.email ? user.email.split('@')[0] : 'Admin';
    const initials = displayName.substring(0, 2).toUpperCase();

    if (document.getElementById('user-name-sidebar')) document.getElementById('user-name-sidebar').innerText = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    if (document.getElementById('user-initials-header')) document.getElementById('user-initials-header').innerText = initials;
    if (document.getElementById('user-avatar-sidebar')) document.getElementById('user-avatar-sidebar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff`;
    return session;
  } catch (err) {
    window.location.href = 'index.html';
    return null;
  }
}

async function getAlumni(statusFilter = null, limit = DEFAULT_ALUMNI_LIMIT) {
  try {
    if (!alumniCache) {
      const stored = localStorage.getItem('alumni_cache');
      if (stored && stored !== 'null') {
        alumniCache = JSON.parse(stored);
      } else {
        // Coba ambil dari Spreadsheet API jika lokal kosong
        const remoteData = await fetchSpreadsheetData();
        if (remoteData && remoteData.length > 0) {
          alumniCache = remoteData;
        } else {
          alumniCache = await loadCsvData(CSV_ALUMNI_URL, SHEET_ALUMNI_FIELDS);
        }

        if ((!alumniCache || !alumniCache.length) && typeof dataAlumni !== 'undefined') {
          alumniCache = dataAlumni.slice();
        }
        persistData();
      }
    }

    let filtered = alumniCache;
    if (statusFilter) {
      filtered = filtered.filter(d => {
        const status = getStatusValue(d);
        if (statusFilter === 'Belum Dilacak') {
          return !status || status === 'Belum Dilacak';
        }
        return status === statusFilter;
      });
    }

    return limit ? filtered.slice(0, limit) : filtered;
  } catch (error) {
    console.error('Error mengambil data alumni:', error);
    let fallback = typeof dataAlumni !== 'undefined' ? dataAlumni : [];
    if (statusFilter) {
      fallback = fallback.filter(d => {
        const status = getStatusValue(d);
        if (statusFilter === 'Belum Dilacak') {
          return !status || status === 'Belum Dilacak';
        }
        return status === statusFilter;
      });
    }
    return limit ? fallback.slice(0, limit) : fallback;
  }
}

async function getLogs() {
  try {
    if (!logsCache) {
      const stored = localStorage.getItem('logs_cache');
      if (stored && stored !== 'null') {
        logsCache = JSON.parse(stored);
      } else {
        logsCache = await loadCsvData(CSV_LOGS_URL, ['id', 'nama', 'query', 'sumber', 'skor', 'hasil', 'created_at']);
        if ((!logsCache || !logsCache.length) && typeof dataLogs !== 'undefined') {
          logsCache = dataLogs.slice();
        }
        persistData();
      }
    }
    return logsCache;
  } catch (error) {
    console.error('Error mengambil logs:', error);
    return typeof dataLogs !== 'undefined' ? dataLogs : [];
  }
}

async function getKandidat() {
  try {
    if (!kandidatCache) {
      const stored = localStorage.getItem('kandidat_cache');
      if (stored && stored !== 'null') {
        kandidatCache = JSON.parse(stored);
      } else {
        kandidatCache = await loadCsvData(CSV_KANDIDAT_URL, ['id_alumni', 'nama', 'nim', 'angkatan', 'kandidat']);
        kandidatCache = kandidatCache.map(item => ({
          ...item,
          kandidat: parseCandidateField(item.kandidat)
        }));
        if ((!kandidatCache || !kandidatCache.length) && typeof kandidatVerifikasi !== 'undefined') {
          kandidatCache = kandidatVerifikasi.slice();
        }
        persistData();
      }
    }
    return kandidatCache;
  } catch (error) {
    console.error('Error mengambil antrean verifikasi:', error);
    return typeof kandidatVerifikasi !== 'undefined' ? kandidatVerifikasi : [];
  }
}

async function logout() {
  const supabase = await ensureSupabase();
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }
  }
  window.location.href = 'index.html';
}

function switchView(viewId) {
  document.getElementById('view-dashboard').classList.add('hidden');
  document.getElementById('view-data').classList.add('hidden');
  document.getElementById('view-pelacakan').classList.add('hidden');
  document.getElementById('view-verifikasi').classList.add('hidden');

  const navIds = ['dashboard', 'data', 'pelacakan', 'verifikasi'];
  navIds.forEach(id => {
    const el = document.getElementById('nav-' + id);
    if(el) {
      el.classList.remove('bg-gray-800', 'text-white');
      el.classList.add('text-gray-400');
    }
  });

  document.getElementById('view-' + viewId).classList.remove('hidden');
  const activeMenu = document.getElementById('nav-' + viewId);
  if(activeMenu) {
    activeMenu.classList.remove('text-gray-400');
    activeMenu.classList.add('bg-gray-800', 'text-white');
  }
}

function getStatusBadge(status) {
  if(status === 'Teridentifikasi') return '<span class="text-green-600 font-semibold bg-green-100 px-2 py-0.5 rounded text-xs">Teridentifikasi</span>';
  if(status === 'Perlu Verifikasi') return '<span class="text-orange-500 font-semibold bg-orange-100 px-2 py-0.5 rounded text-xs">Perlu Verifikasi</span>';
  if(status === 'Belum Dilacak') return '<span class="text-gray-500 font-semibold bg-gray-200 px-2 py-0.5 rounded text-xs">Belum Dilacak</span>';
  return '<span class="text-red-500 font-semibold bg-red-100 px-2 py-0.5 rounded text-xs">Tidak Ditemukan</span>';
}

function getStatusValue(item) {
  return item.status || '';
}

function getTahunLulus(item) {
  return item.tanggal_lulus || item.tahun_lulus || '';
}

function toggleSumber(id) {
  const btn = document.getElementById(id);
  const label = document.getElementById('label-' + id.split('-')[1]);
  
  if (btn.innerText === 'ON') {
    btn.innerText = 'OFF';
    btn.classList.remove('bg-blue-600');
    btn.classList.add('bg-gray-300');
    if(label) { label.classList.remove('text-gray-700'); label.classList.add('text-gray-400'); }
  } else {
    btn.innerText = 'ON';
    btn.classList.remove('bg-gray-300');
    btn.classList.add('bg-blue-600');
    if(label) { label.classList.remove('text-gray-400'); label.classList.add('text-gray-700'); }
  }
}


function generateDummyProfile(target) {
  const positions = ['Software Engineer', 'Data Analyst', 'Marketing Executive', 'Accountant', 'HR Specialist', 'Product Manager', 'Teacher', 'Civil Engineer'];
  const companies = ['Gojek', 'Tokopedia', 'PT Telkom Indonesia', 'Bank Central Asia (BCA)', 'Shopee Indonesia', 'Traveloka', 'Pertamina', 'Unilever Indonesia', 'PT Astra International', 'Grab Indonesia', 'Bank Mandiri'];
  const cities = ['Jakarta', 'Surabaya', 'Bandung', 'Malang', 'Yogyakarta', 'Semarang', 'Medan'];

  const selectedPosisi = positions[Math.floor(Math.random() * positions.length)];
  const selectedCompany = companies[Math.floor(Math.random() * companies.length)];
  const selectedCity = cities[Math.floor(Math.random() * cities.length)];
  const employmentType = ['PNS', 'Swasta', 'Wirausaha'][Math.floor(Math.random() * 3)];
  
  const nameParts = target.nama.toLowerCase().split(' ');
  const firstName = nameParts[0];

  return {
    posisi: target.posisi || selectedPosisi,
    status_pekerjaan: target.status_pekerjaan || employmentType,
    email: target.email || (Math.random() > 0.2 ? `${firstName}.${Math.floor(Math.random()*99)}@gmail.com` : ''),
    no_hp: target.no_hp || (Math.random() > 0.3 ? `08${Math.floor(100000000 + Math.random() * 900000000)}` : ''),
    tempat_bekerja: target.tempat_bekerja || (employmentType === 'Wirausaha' ? `Owner - ${target.nama.split(' ')[0]} Coffee/Business` : (employmentType === 'PNS' ? 'Instansi Pemerintah' : selectedCompany)),
    alamat_bekerja: target.alamat_bekerja || selectedCity,
    // Probabilitas kemunculan sosmed (acak: ada yang punya, ada yang tidak)
    linkedin: target.linkedin || (Math.random() > 0.4 ? `linkedin.com/in/${firstName}-${Math.floor(Math.random()*1000)}` : ''),
    instagram: target.instagram || (Math.random() > 0.5 ? `@${firstName}_${nameParts[1] || ''}` : ''),
    facebook: target.facebook || (Math.random() > 0.7 ? target.nama : ''),
    tiktok: target.tiktok || (Math.random() > 0.8 ? `@${firstName}.daily` : ''),
    sosmed_tempat_bekerja: target.sosmed_tempat_bekerja || (Math.random() > 0.5 ? `linkedin.com/company/${selectedCompany.toLowerCase().replace(/\s+/g, '')}` : '')
  };
}

async function refreshUI() {
  // Ambil seluruh cache alumni untuk perhitungan statistik yang akurat
  const allAlumni = await getAlumni(null, null);
  // Data terbatas untuk tampilan tabel (limit 20)
  const data = allAlumni.slice(0, DEFAULT_ALUMNI_LIMIT);
  const logs = await getLogs();
  const queue = await getKandidat();

  // Update UI tombol hapus
  const btnHapus = document.getElementById('btn-hapus-mode');
  const btnKonfirmasi = document.getElementById('btn-konfirmasi-hapus');
  if (btnHapus && btnKonfirmasi) {
    if (isHapusMode) {
      btnHapus.innerHTML = 'Batal';
      btnHapus.classList.replace('bg-red-600', 'bg-gray-500');
      btnKonfirmasi.classList.remove('hidden');
    } else {
      btnHapus.innerHTML = 'Hapus Data';
      btnHapus.classList.replace('bg-gray-500', 'bg-red-600');
      btnKonfirmasi.classList.add('hidden');
      const countEl = document.getElementById('count-terpilih');
      if (countEl) countEl.innerText = '0';
    }
  }

  // Handle Header Table untuk checkbox
  const theadTr = document.querySelector('#view-data table thead tr');
  if (theadTr) {
    const existingCol = theadTr.querySelector('.col-hapus');
    if (isHapusMode && !existingCol) {
      const th = document.createElement('th');
      th.className = 'px-4 py-3 font-medium col-hapus w-10';
      th.innerHTML = '<i class="far fa-check-square"></i>';
      theadTr.prepend(th);
    } else if (!isHapusMode && existingCol) {
      existingCol.remove();
    }
  }
  
  // Filter data teridentifikasi dari seluruh cache
  const allVerifiedData = allAlumni.filter(d => getStatusValue(d) === 'Teridentifikasi');

  const total = allAlumni.length;
  const teridentifikasi = allAlumni.filter(d => getStatusValue(d) === 'Teridentifikasi').length;
  const verifikasi = allAlumni.filter(d => getStatusValue(d) === 'Perlu Verifikasi').length;
  const belumDilacak = allAlumni.filter(d => getStatusValue(d) === 'Belum Dilacak' || !getStatusValue(d)).length;
  const tidakDitemukan = allAlumni.filter(d => getStatusValue(d) === 'Tidak Ditemukan').length;
  
  const belumAtauTidak = belumDilacak + tidakDitemukan;

  const countTotalEl = document.getElementById('count-total');
  const countTeriEl = document.getElementById('count-teridentifikasi');
  const countVeriEl = document.getElementById('count-verifikasi');
  const countBelumEl = document.getElementById('count-belum');

  if(countTotalEl) countTotalEl.innerText = total;
  if(countTeriEl) countTeriEl.innerText = teridentifikasi;
  if(countVeriEl) countVeriEl.innerText = verifikasi;
  if(countBelumEl) countBelumEl.innerText = belumAtauTidak;

  // Update statistik lingkaran di dashboard
  const persentase = total === 0 ? 0 : Math.round(((total - belumDilacak) / total) * 100);
  if(document.getElementById('count-teridentifikasi-circle')) document.getElementById('count-teridentifikasi-circle').innerText = teridentifikasi;
  if(document.getElementById('count-verifikasi-circle')) document.getElementById('count-verifikasi-circle').innerText = verifikasi;
  if(document.getElementById('count-belum-circle')) document.getElementById('count-belum-circle').innerText = belumAtauTidak;
  if(document.getElementById('track-progress-circle')) document.getElementById('track-progress-circle').innerText = persentase + '%';

  const trackTotal = document.getElementById('track-total');
  const trackSelesai = document.getElementById('track-selesai');
  const trackAntrean = document.getElementById('track-antrean');
  const progressBar = document.getElementById('track-progress-bar');
  const progressText = document.getElementById('track-progress-text');
  
  if (trackTotal) {
    const selesaiProses = total - belumDilacak; 
    const persentase = total === 0 ? 0 : Math.round((selesaiProses / total) * 100);
    
    trackTotal.innerText = total;
    trackSelesai.innerText = selesaiProses;
    trackAntrean.innerText = belumDilacak;
    progressBar.style.width = persentase + '%';
    progressText.innerText = persentase + '% selesai';
  }

  const tbodyDash = document.getElementById('tbody-dashboard-recent');
  if(tbodyDash) {
    tbodyDash.innerHTML = '';
    const trackedData = data.filter(d => getStatusValue(d) !== 'Belum Dilacak' && getStatusValue(d) !== '');
    trackedData.slice().reverse().slice(0, 4).forEach(d => {
      const log = logs.find(l => l.nama === d.nama);
      const skorDisplay = d.skor !== undefined ? d.skor : (log ? log.skor : '-');
      
      tbodyDash.innerHTML += `
      <tr class="hover:bg-gray-50">
        <td class="px-4 py-3 text-gray-700">${d.nama}</td>
        <td class="px-4 py-3 text-gray-500">${getTahunLulus(d)}</td>
        <td class="px-4 py-3 font-bold text-gray-600">${skorDisplay}</td>
        <td class="px-4 py-3">${getStatusBadge(getStatusValue(d))}</td>
      </tr>`;
    });
  }


  const tbodyData = document.getElementById('tbody-data-alumni');
  const paginationContainer = document.getElementById('pagination-data-alumni');
  const searchInput = document.getElementById('search-alumni');
  const keyword = searchInput ? searchInput.value.toLowerCase() : '';

  if(tbodyData) {
    tbodyData.innerHTML = '';
    
    const filteredData = allVerifiedData.filter(d => 
      d.nama.toLowerCase().includes(keyword) || d.nim.toLowerCase().includes(keyword)
    );

    if (filteredData.length === 0) {
      tbodyData.innerHTML = `<tr><td colspan="7" class="px-4 py-6 text-center text-gray-500">Tidak ada data alumni yang cocok / sudah dilacak.</td></tr>`;
      if (paginationContainer) paginationContainer.innerHTML = '';
    } else {
      const totalItems = filteredData.length;
      const totalPages = Math.ceil(totalItems / DEFAULT_ALUMNI_LIMIT);
      const pagedData = filteredData.slice((currentPageDataAlumni - 1) * DEFAULT_ALUMNI_LIMIT, currentPageDataAlumni * DEFAULT_ALUMNI_LIMIT);

      pagedData.forEach((d, i) => {
        const checkboxTD = isHapusMode ? `<td class="px-4 py-3"><input type="checkbox" class="del-checkbox w-4 h-4 text-red-600" value="${d.id}" onchange="updateHapusCount()"></td>` : '';
        
        const jobDisplay = d.posisi 
          ? `<div class="font-medium text-gray-800">${d.posisi}</div>
             <div class="text-xs text-gray-500">${d.tempat_bekerja || '-'} (${d.status_pekerjaan || 'Swasta'})</div>
             <div class="text-[10px] text-gray-400 italic">${d.alamat_bekerja || '-'}</div>`
          : (d.pekerjaan || '-');
        
        const contactDisplay = `
          <div class="text-xs text-gray-600"><i class="far fa-envelope mr-1"></i>${d.email || '-'}</div>
          <div class="text-xs text-gray-500"><i class="fas fa-phone-alt mr-1"></i>${d.no_hp || '-'}</div>
        `;

        const sosmedDisplay = `
          <div class="flex space-x-1 text-gray-400">
            <i class="fab fa-linkedin ${d.linkedin && d.linkedin !== '#' ? 'text-blue-600' : ''}" title="Linkedin"></i>
            <i class="fab fa-instagram ${d.instagram && d.instagram !== '#' ? 'text-pink-500' : ''}" title="IG"></i>
            <i class="fab fa-facebook ${d.facebook && d.facebook !== '#' ? 'text-blue-800' : ''}" title="FB"></i>
            <i class="fab fa-tiktok ${d.tiktok && d.tiktok !== '#' ? 'text-black' : ''}" title="TikTok"></i>
            <span class="mx-1 text-gray-300">|</span>
            <i class="fas fa-building ${d.sosmed_tempat_bekerja && d.sosmed_tempat_bekerja !== '#' ? 'text-orange-500' : ''}" title="Sosmed Kantor"></i>
          </div>
        `;

        tbodyData.innerHTML += `
        <tr class="hover:bg-gray-50 border-b border-gray-100 ${isHapusMode ? 'bg-red-50/30' : ''}">
          ${checkboxTD}
          <td class="px-4 py-3 text-gray-500">${((currentPageDataAlumni - 1) * DEFAULT_ALUMNI_LIMIT) + (i + 1)}</td>
          <td class="px-4 py-3">
            <div class="font-medium text-gray-700">${d.nama}</div>
            <div class="text-xs text-gray-500">NIM: ${d.nim} · Lulus: ${getTahunLulus(d)}</div>
          </td>
          <td class="px-4 py-3">${contactDisplay}</td>
          <td class="px-4 py-3">${jobDisplay}</td>
          <td class="px-4 py-3">${sosmedDisplay}</td>
          <td class="px-4 py-3">
            <div class="mb-1">${getStatusBadge(getStatusValue(d))}</div>
            <div class="text-[10px] text-gray-400">Sumber: ${d.sumber || '-'}</div>
          </td>
        </tr>`;
      });

      if (paginationContainer) {
        const startEntry = (currentPageDataAlumni - 1) * DEFAULT_ALUMNI_LIMIT + 1;
        const endEntry = Math.min(currentPageDataAlumni * DEFAULT_ALUMNI_LIMIT, totalItems);
        
        paginationContainer.innerHTML = `
          <div class="flex items-center justify-between">
            <div class="text-xs text-gray-500">Menampilkan <span class="font-medium text-gray-700">${startEntry}</span> - <span class="font-medium text-gray-700">${endEntry}</span> dari <span class="font-medium text-gray-700">${totalItems}</span> data</div>
            <div class="flex space-x-1">
              <button onclick="changePageDataAlumni(${currentPageDataAlumni - 1})" ${currentPageDataAlumni === 1 ? 'disabled' : ''} class="px-3 py-1 border rounded text-xs ${currentPageDataAlumni === 1 ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'text-gray-600 hover:bg-white hover:text-blue-600 shadow-sm'}">Previous</button>
              <div class="px-3 py-1 text-xs text-gray-500 self-center">Hal ${currentPageDataAlumni} / ${totalPages}</div>
              <button onclick="changePageDataAlumni(${currentPageDataAlumni + 1})" ${currentPageDataAlumni === totalPages ? 'disabled' : ''} class="px-3 py-1 border rounded text-xs ${currentPageDataAlumni === totalPages ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'text-gray-600 hover:bg-white hover:text-blue-600 shadow-sm'}">Next</button>
            </div>
          </div>
        `;
      }
    }
  }

  const tbodyAntrean = document.getElementById('tbody-antrean-pelacakan');
  if(tbodyAntrean) {
    tbodyAntrean.innerHTML = '';
    const antreanData = allAlumni.filter(d => getStatusValue(d) === 'Belum Dilacak' || !getStatusValue(d));
    
    if (antreanData.length === 0) {
      tbodyAntrean.innerHTML = `<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500 bg-gray-50/50 italic">Tidak ada data alumni baru di dalam antrean pelacakan saat ini.</td></tr>`;
    } else {
      antreanData.forEach((d, i) => {
        tbodyAntrean.innerHTML += `
        <tr class="hover:bg-gray-50">
          <td class="px-4 py-3 text-gray-500">${i+1}</td>
          <td class="px-4 py-3 font-medium text-gray-700">${d.nama}</td>
          <td class="px-4 py-3 text-gray-500">${d.nim}</td>
          <td class="px-4 py-3 text-gray-500">${getTahunLulus(d)}</td>
          <td class="px-4 py-3">${getStatusBadge(getStatusValue(d))}</td>
        </tr>`;
      });
    }
  }

  const tbodyLog = document.getElementById('tbody-log-query');
  if(tbodyLog) {
    tbodyLog.innerHTML = '';
    logs.slice().reverse().slice(0, 8).forEach(l => {
      let color = l.skor >= 80 ? 'bg-green-500' : (l.skor >= 60 ? 'bg-yellow-400' : 'bg-red-400');
      let hasilBadge = l.hasil === 'Cocok' ? '<span class="text-green-600 bg-green-100 px-2 rounded text-xs">Cocok</span>' : 
      (l.hasil === 'Ambigu' ? '<span class="text-yellow-600 bg-yellow-100 px-2 rounded text-xs">Perlu Tinjauan</span>' : '<span class="text-red-500 bg-red-100 px-2 rounded text-xs">Tidak Cocok</span>');

      tbodyLog.innerHTML += `
      <tr class="hover:bg-gray-50">
        <td class="px-4 py-3 text-gray-700">${l.nama}</td>
        <td class="px-4 py-3 text-gray-500 font-mono text-xs">${l.query}</td>
        <td class="px-4 py-3"><span class="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-xs">${l.sumber}</span></td>
        <td class="px-4 py-3">
          <div class="flex items-center">
            <div class="w-16 bg-gray-200 rounded-full h-1.5 mr-2"><div class="${color} h-1.5 rounded-full" style="width: ${l.skor}%"></div></div>
            <span class="text-xs text-gray-500 font-bold">${l.skor}</span>
          </div>
        </td>
        <td class="px-4 py-3">${hasilBadge}</td>
      </tr>`;
    });
  }

  const queueCountEl = document.getElementById('veri-queue-count');
  if(queueCountEl) queueCountEl.innerText = queue.length;
  
  const containerVerifikasi = document.getElementById('container-verifikasi');
  if(containerVerifikasi) {
    containerVerifikasi.innerHTML = '';
    if(queue.length === 0) {
      containerVerifikasi.innerHTML = '<div class="bg-white p-6 rounded border border-gray-200 text-center text-gray-500">Tidak ada data yang perlu diverifikasi.</div>';
    } else {
      queue.forEach(q => {
        if (!q.kandidat || !Array.isArray(q.kandidat)) q.kandidat = [];
        let cardsHTML = '';
        q.kandidat.forEach(k => {
          cardsHTML += `
          <div class="border border-gray-200 rounded p-4 bg-gray-50">
            <div class="flex justify-between items-center mb-2">
              <span class="bg-blue-100 text-blue-600 px-2 rounded text-xs">${k.sumber}</span>
              <span class="text-xs text-gray-500 font-bold">Skor: ${k.skor}</span>
            </div>
            <h4 class="font-medium text-gray-700">${k.nama}</h4>
            <p class="text-sm text-gray-600">${k.jabatan}</p>
            <p class="text-xs text-gray-400">${k.detail}</p>
            <div class="w-full bg-gray-200 rounded-full h-1 mt-3"><div class="${k.skor >= 80 ? 'bg-green-500' : (k.skor >= 60 ? 'bg-yellow-400' : 'bg-red-500')} h-1 rounded-full" style="width: ${k.skor}%"></div></div>
          </div>`;
        });

        containerVerifikasi.innerHTML += `
        <div class="bg-white border border-yellow-200 rounded overflow-hidden shadow-sm">
          <div class="bg-yellow-50 p-4 border-b border-yellow-200 flex justify-between items-center">
            <div>
              <h3 class="font-medium text-gray-800">${q.nama}</h3>
              <p class="text-xs text-gray-500">NIM ${q.nim} · Angkatan ${q.angkatan}</p>
            </div>
            <span class="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">Perlu Verifikasi · ${q.kandidat.length} kandidat</span>
          </div>
          <div class="p-4">
            <p class="text-xs font-bold text-gray-400 mb-3">KANDIDAT DITEMUKAN:</p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">${cardsHTML}</div>
            <div class="flex justify-end space-x-2 pt-4 border-t border-gray-100">
              <button onclick="prosesVerifikasi('${q.id_alumni}', null)" class="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50">Tidak Cocok</button>
              <button onclick="prosesVerifikasi('${q.id_alumni}', ${q.kandidat[0] ? "'" + q.kandidat[0].id_k + "'" : 'null'})" class="px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600"><i class="fas fa-check mr-1"></i> Kandidat Valid</button>
            </div>
          </div>
        </div>`;
      });
    }
  }
}

async function jalankanPelacakan() {
  const button = document.querySelector('button[onclick="jalankanPelacakan()"]');
  const resetButton = () => {
    if (button) {
      button.disabled = false;
      button.innerHTML = '<i class="fas fa-play mr-1"></i> Jalankan Job Sekarang';
    }
  };

  if (button) {
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Sedang berjalan...';
  }

  const isScholar = document.getElementById('src-scholar').innerText === 'ON';
  const isOrcid = document.getElementById('src-orcid').innerText === 'ON';
  const isLinkedin = document.getElementById('src-linkedin').innerText === 'ON';
  const isGithub = document.getElementById('src-github').innerText === 'ON';

  let activeSources = [];
  if(isScholar) activeSources.push('Scholar');
  if(isOrcid) activeSources.push('ORCID');
  if(isLinkedin) activeSources.push('LinkedIn');
  if(isGithub) activeSources.push('GitHub');

  if(activeSources.length === 0) {
    alert("Nyalakan setidaknya satu sumber di panel 'Konfigurasi Sumber' sebelum melacak!");
    resetButton();
    return;
  }

  const data = await getAlumni('Belum Dilacak', TRACKING_BATCH_SIZE);
  const logs = await getLogs();
  const queue = await getKandidat();
  const unTracked = data.filter(a => !getStatusValue(a) || getStatusValue(a) === 'Belum Dilacak');

  if(unTracked.length === 0) {
    alert("Tidak ada data baru di antrean pelacakan saat ini.");
    resetButton();
    return;
  }

  let countProcessed = 0;
  let updates = [];
  let newLogs = [];
  let newQueueItems = [];

  for (const target of unTracked) {
    const source = activeSources[Math.floor(Math.random() * activeSources.length)];
    let skor = 0;

    let matchAfiliasi = Math.random() > 0.3;
    let matchTahun = Math.random() > 0.4;
    let matchBidang = Math.random() > 0.5;

    if (matchAfiliasi) skor += 40;
    if (matchTahun) skor += 30;
    if (matchBidang) skor += 30;

    const dummyProfile = generateDummyProfile(target);
    let updateValues = {
      linkedin: dummyProfile.linkedin,
      instagram: dummyProfile.instagram,
      facebook: dummyProfile.facebook,
      tiktok: dummyProfile.tiktok,
      email: dummyProfile.email,
      no_hp: dummyProfile.no_hp,
      tempat_bekerja: dummyProfile.tempat_bekerja,
      alamat_bekerja: dummyProfile.alamat_bekerja,
      posisi: dummyProfile.posisi,
      status_pekerjaan: dummyProfile.status_pekerjaan,
      sosmed_tempat_bekerja: dummyProfile.sosmed_tempat_bekerja,
      skor: skor
    };

    if (skor > 80) {
      updateValues.status = 'Teridentifikasi';
      updateValues.sumber = source;
      newLogs.push({ id: Date.now() + countProcessed, nama: target.nama, query: `"${target.nama}" + "${source}"`, sumber: source, skor: skor, hasil: "Cocok" });
    } else if (skor >= 60) {
      updateValues.status = 'Perlu Verifikasi';
      updateValues.sumber = source;
      // Gunakan ID alumni sebagai referensi ID kandidat agar konsisten
      newQueueItems.push({
        id_alumni: target.id,
        nama: target.nama,
        nim: target.nim,
        angkatan: target.tahun_lulus || target.tanggal_lulus || '',
        kandidat: [
          {
            id_k: 'k-' + target.id,
            sumber: source,
            nama: target.nama,
            jabatan: dummyProfile.posisi,
            detail: `Hasil pencocokan: Afiliasi ${matchAfiliasi?'Ya':'Tidak'}, Tahun ${matchTahun?'Ya':'Tidak'}, Bidang ${matchBidang?'Ya':'Tidak'}`,
            skor: skor
          }
        ]
      });
      newLogs.push({ id: Date.now() + countProcessed, nama: target.nama, query: `"${target.nama}" + "UMM"`, sumber: source, skor: skor, hasil: "Ambigu" });
    } else {
      updateValues.status = 'Tidak Ditemukan';
      updateValues.status_pekerjaan = 'Tidak Ditemukan';
      updateValues.sumber = source;
      newLogs.push({ id: Date.now() + countProcessed, nama: target.nama, query: `"${target.nama}"`, sumber: source, skor: skor, hasil: "Tidak Cocok" });
    }

    updates.push({
      id: target.id,
      data: updateValues
    });

    countProcessed++;
  }

  updates.forEach(item => {
    const target = alumniCache && alumniCache.find(a => a.id === item.id);
    if (target) {
      Object.assign(target, item.data);
    }
    if (typeof dataAlumni !== 'undefined') {
      const fallbackTarget = dataAlumni.find(a => a.id === item.id);
      if (fallbackTarget) Object.assign(fallbackTarget, item.data);
    }
  });

  if (logsCache) logsCache.push(...newLogs);
  if (typeof dataLogs !== 'undefined') dataLogs.push(...newLogs);

  if (kandidatCache) kandidatCache.push(...newQueueItems);
  if (typeof kandidatVerifikasi !== 'undefined') kandidatVerifikasi.push(...newQueueItems);

  persistData();
  await refreshUI();
  alert(`Sistem selesai memproses ${countProcessed} alumni baru!\nData telah berpindah ke halaman Data Alumni atau Verifikasi Manual (Skor 60-80).`);
  resetButton();
}

async function generateDataFromScript() {
  const button = document.querySelector('button[onclick="generateDataFromScript()"]');
  if (button) {
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Mengambil Data...';
  }

  // Ambil nilai dari range slider UI
  const limitVal = document.getElementById('range-limit') ? parseInt(document.getElementById('range-limit').value) : 10;

  try {
    // Panggil fungsi fetch ke Spreadsheet API dengan limit yang dipilih
    const newRecords = await fetchSpreadsheetData(limitVal);

    if (newRecords && newRecords.length > 0) {
      alumniCache = alumniCache || [];
      
      // Filter data agar tidak ada Nama dan NIM yang sama dengan yang sudah ada di cache
      // Juga memfilter duplikat di dalam batch yang baru ditarik
      const uniqueNewRecords = [];
      const seenInBatch = new Set();

      for (const record of newRecords) {
        const identifier = `${record.nama}-${record.nim}`;
        const isDuplicateInCache = alumniCache.some(a => a.nama === record.nama && a.nim === record.nim);
        
        if (!isDuplicateInCache && !seenInBatch.has(identifier)) {
          uniqueNewRecords.push(record);
          seenInBatch.add(identifier);
        }
      }

      if (uniqueNewRecords.length > 0) {
        alumniCache.unshift(...uniqueNewRecords);
        if (typeof dataAlumni !== 'undefined') dataAlumni.unshift(...uniqueNewRecords);
        
        persistData();
        await refreshUI();
        alert(`Berhasil menarik ${uniqueNewRecords.length} data alumni baru dari Spreadsheet!`);
      } else {
        alert("Data dari spreadsheet sudah ada di sistem (Duplikat).");
      }
    } else {
      alert("Gagal mengambil data atau spreadsheet kosong.");
    }
  } catch (error) {
    console.error("Error in generateDataFromScript:", error);
    alert("Terjadi kesalahan saat menghubungi server Spreadsheet.");
  }

  if (button) {
    button.disabled = false;
    button.innerHTML = '<i class="fas fa-magic mr-1"></i> Generate';
  }
}

function bukaModal() {
  document.getElementById('modal-tambah').classList.remove('hidden');
}

function tutupModal() {
  document.getElementById('modal-tambah').classList.add('hidden');
  document.getElementById('input-nama').value = '';
  document.getElementById('input-nim').value = '';
  document.getElementById('input-tahun').value = '';
}

async function simpanDataBaru() {
  const nama = document.getElementById('input-nama').value.trim();
  const nim = document.getElementById('input-nim').value.trim();
  const tahun = document.getElementById('input-tahun').value.trim();

  if(!nama || !nim || !tahun) {
    alert("Harap isi Nama, NIM, dan Tahun Lulus!");
    return;
  }

  const data = await getAlumni(null, null);
  const isDuplicate = data.some(alumni => alumni.nim === nim);

  if (isDuplicate) {
    alert(`Gagal menyimpan! Alumni dengan NIM ${nim} sudah terdaftar di sistem.`);
    return;
  }

  const newData = {
    id: Date.now().toString(),
    // ...
    nim,
    nama,
    tanggal_lulus: tahun,
    email: '',
    no_hp: '',
    linkedin: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    tempat_bekerja: '',
    alamat_bekerja: '',
    posisi: '',
    status_pekerjaan: 'Belum Dilacak',
    sosmed_tempat_bekerja: '',
    sumber: '-',
    skor: '',
    status: 'Belum Dilacak'
  };

  alumniCache = alumniCache || [];
  alumniCache.unshift(newData);

  if (typeof dataAlumni !== 'undefined' && Array.isArray(dataAlumni)) {
    dataAlumni.unshift(newData);
  }

  persistData();
  tutupModal();
  refreshUI();

  alert(`Data ${nama} berhasil ditambahkan!\nSilakan buka menu Pelacakan dan tekan "Jalankan Job" untuk melacak data ini.`);
}

async function prosesVerifikasi(id_alumni, id_kandidat_valid) {
  const queue = await getKandidat();

  const queueItem = queue.find(kv => String(kv.id_alumni) === String(id_alumni));
  if (!queueItem) {
    alert('Data verifikasi tidak ditemukan di antrean.');
    return;
  }

  let updateValues = {};
  if(id_kandidat_valid !== null) {
    const k = queueItem.kandidat.find(c => String(c.id_k) === String(id_kandidat_valid));
    updateValues = {
      status: 'Teridentifikasi',
      posisi: k ? k.jabatan : 'Dikonfirmasi Admin',
      status_pekerjaan: 'Swasta', 
      pekerjaan: k ? k.jabatan : 'Dikonfirmasi Admin',
      sumber: k ? k.sumber : 'Verifikasi Manual',
      skor: 100
    };
  } else {
    updateValues = {
      status: 'Tidak Ditemukan',
      posisi: 'Tidak ditemukan (Validasi Admin)',
      pekerjaan: 'Tidak ditemukan (Validasi Admin)',
      sumber: '-',
      skor: 0
    };
  }

  if (alumniCache) {
    const target = alumniCache.find(a => a.id === id_alumni);
    if (target) Object.assign(target, updateValues);
  }
  if (typeof dataAlumni !== 'undefined' && Array.isArray(dataAlumni)) {
    const target = dataAlumni.find(a => a.id === id_alumni);
    if (target) Object.assign(target, updateValues);
  }

  const kIdx = queue.findIndex(kv => String(kv.id_alumni) === String(id_alumni));
  if(kIdx !== -1) queue.splice(kIdx, 1);

  if (kandidatCache) {
    const cacheIdx = kandidatCache.findIndex(kv => String(kv.id_alumni) === String(id_alumni));
    if (cacheIdx !== -1) kandidatCache.splice(cacheIdx, 1);
  }
  if (typeof kandidatVerifikasi !== 'undefined' && Array.isArray(kandidatVerifikasi)) {
    const cacheIdx = kandidatVerifikasi.findIndex(kv => String(kv.id_alumni) === String(id_alumni));
    if (cacheIdx !== -1) kandidatVerifikasi.splice(cacheIdx, 1);
  }

  persistData();
  refreshUI();
  alert("Data berhasil dikonfirmasi dan masuk ke Data Alumni!");
}

function toggleHapusMode() {
  isHapusMode = !isHapusMode;
  refreshUI();
}

function updateHapusCount() {
  const count = document.querySelectorAll('.del-checkbox:checked').length;
  const countEl = document.getElementById('count-terpilih');
  if (countEl) countEl.innerText = count;
}

async function hapusDataTerpilih() {
  const selectedCheckboxes = document.querySelectorAll('.del-checkbox:checked');
  const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);

  if (selectedIds.length === 0) {
    alert("Pilih setidaknya satu data untuk dihapus.");
    return;
  }

  if (confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} data alumni terpilih secara permanen?`)) {
    alumniCache = alumniCache.filter(a => !selectedIds.includes(String(a.id)));
    if (typeof dataAlumni !== 'undefined') {
      dataAlumni = dataAlumni.filter(a => !selectedIds.includes(String(a.id)));
    }
    isHapusMode = false;
    persistData();
    refreshUI();
    alert("Data berhasil dihapus dari sistem.");
  }
}

window.changePageDataAlumni = function(newPage) {
  currentPageDataAlumni = newPage;
  refreshUI();
};

// Inisialisasi Auth secepat mungkin untuk mencegah akses ilegal
(async () => {
  const session = await checkAuth();
  if (session) {
    // Tampilkan body hanya jika sesi benar-benar ada
    document.getElementById('main-body').style.display = 'flex';
    // Jalankan inisialisasi UI hanya jika sesi valid
    switchView('dashboard');
    refreshUI();
  }
})();