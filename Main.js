function logout() {
  window.location.href = '../Login.html';
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

function refreshUI() {
  const data = getAlumni();
  const logs = getLogs();
  const queue = getKandidat();

  const total = data.length;
  const teridentifikasi = data.filter(d => d.status === 'Teridentifikasi').length;
  const verifikasi = data.filter(d => d.status === 'Perlu Verifikasi').length;
  const belumDilacak = data.filter(d => d.status === 'Belum Dilacak').length;
  const tidakDitemukan = data.filter(d => d.status === 'Tidak Ditemukan').length;
  
  const belumAtauTidak = belumDilacak + tidakDitemukan;

  const countTotalEl = document.getElementById('count-total');
  const countTeriEl = document.getElementById('count-teridentifikasi');
  const countVeriEl = document.getElementById('count-verifikasi');
  const countBelumEl = document.getElementById('count-belum');

  if(countTotalEl) countTotalEl.innerText = total;
  if(countTeriEl) countTeriEl.innerText = teridentifikasi;
  if(countVeriEl) countVeriEl.innerText = verifikasi;
  if(countBelumEl) countBelumEl.innerText = belumAtauTidak;

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
    const trackedData = data.filter(d => d.status !== 'Belum Dilacak');
    trackedData.slice().reverse().slice(0, 4).forEach(d => {
      const log = logs.find(l => l.nama === d.nama);
      const skorDisplay = d.skor !== undefined ? d.skor : (log ? log.skor : '-');
      
      tbodyDash.innerHTML += `
      <tr class="hover:bg-gray-50">
        <td class="px-4 py-3 text-gray-700">${d.nama}</td>
        <td class="px-4 py-3 text-gray-500">${d.tahun_lulus}</td>
        <td class="px-4 py-3 font-bold text-gray-600">${skorDisplay}</td>
        <td class="px-4 py-3">${getStatusBadge(d.status)}</td>
      </tr>`;
    });
  }


  const tbodyData = document.getElementById('tbody-data-alumni');
  const searchInput = document.getElementById('search-alumni');
  const keyword = searchInput ? searchInput.value.toLowerCase() : '';

  if(tbodyData) {
    tbodyData.innerHTML = '';
    
    const filteredData = data.filter(d => 
      d.status !== 'Belum Dilacak' && 
      (d.nama.toLowerCase().includes(keyword) || d.nim.toLowerCase().includes(keyword))
    );

    if (filteredData.length === 0) {
      tbodyData.innerHTML = `<tr><td colspan="7" class="px-4 py-6 text-center text-gray-500">Tidak ada data alumni yang cocok / sudah dilacak.</td></tr>`;
    } else {
      filteredData.forEach((d, i) => {
        tbodyData.innerHTML += `
        <tr class="hover:bg-gray-50">
          <td class="px-4 py-3 text-gray-500">${i+1}</td>
          <td class="px-4 py-3 font-medium text-gray-700">${d.nama}</td>
          <td class="px-4 py-3 text-gray-500">${d.nim}</td>
          <td class="px-4 py-3 text-gray-500">${d.tahun_lulus}</td>
          <td class="px-4 py-3 text-gray-600">${d.pekerjaan}</td>
          <td class="px-4 py-3"><span class="${d.sumber !== '-' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'} px-2 py-0.5 rounded text-xs">${d.sumber}</span></td>
          <td class="px-4 py-3">${getStatusBadge(d.status)}</td>
        </tr>`;
      });
    }
  }

  const tbodyAntrean = document.getElementById('tbody-antrean-pelacakan');
  if(tbodyAntrean) {
    tbodyAntrean.innerHTML = '';
    const antreanData = data.filter(d => d.status === 'Belum Dilacak');
    
    if (antreanData.length === 0) {
      tbodyAntrean.innerHTML = `<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500 bg-gray-50/50 italic">Tidak ada data alumni baru di dalam antrean pelacakan saat ini.</td></tr>`;
    } else {
      antreanData.forEach((d, i) => {
        tbodyAntrean.innerHTML += `
        <tr class="hover:bg-gray-50">
          <td class="px-4 py-3 text-gray-500">${i+1}</td>
          <td class="px-4 py-3 font-medium text-gray-700">${d.nama}</td>
          <td class="px-4 py-3 text-gray-500">${d.nim}</td>
          <td class="px-4 py-3 text-gray-500">${d.tahun_lulus}</td>
          <td class="px-4 py-3">${getStatusBadge(d.status)}</td>
        </tr>`;
      });
    }
  }

  const tbodyLog = document.getElementById('tbody-log-query');
  if(tbodyLog) {
    tbodyLog.innerHTML = '';
    logs.slice(0, 8).forEach(l => {
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
              <button onclick="prosesVerifikasi(${q.id_alumni}, null)" class="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50">Tidak Cocok</button>
              <button onclick="prosesVerifikasi(${q.id_alumni}, ${q.kandidat[0].id_k})" class="px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600"><i class="fas fa-check mr-1"></i> Kandidat Valid</button>
            </div>
          </div>
        </div>`;
      });
    }
  }
}

function jalankanPelacakan() {
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
    return;
  }

  const data = getAlumni();
  const logs = getLogs();
  const queue = getKandidat();

  const unTracked = data.filter(a => a.status === 'Belum Dilacak');

  if(unTracked.length === 0) {
    alert("Tidak ada data baru di antrean pelacakan saat ini.");
    return;
  }

  let countProcessed = 0;

  unTracked.forEach(target => {
    const source = activeSources[Math.floor(Math.random() * activeSources.length)];
    let skor = 0;
    
    let matchAfiliasi = Math.random() > 0.3; 
    let matchTahun = Math.random() > 0.4;    
    let matchBidang = Math.random() > 0.5;   

    if (matchAfiliasi) skor += 40;
    if (matchTahun) skor += 30;
    if (matchBidang) skor += 30;

    target.skor = skor; 

    if (skor > 80) {
      target.status = 'Teridentifikasi';
      target.pekerjaan = `Staff/Karyawan · Validasi Otomatis via ${source}`;
      target.sumber = source;
      logs.unshift({ id: Date.now(), nama: target.nama, query: `"${target.nama}" + "${source}"`, sumber: source, skor: skor, hasil: "Cocok" });
      
    } else if (skor >= 60) { 
      target.status = 'Perlu Verifikasi';
      target.pekerjaan = `Kandidat Ditemukan (${skor}%)`;
      target.sumber = source;
      
      queue.push({
        id_alumni: target.id,
        nama: target.nama,
        nim: target.nim,
        angkatan: target.tahun_lulus,
        kandidat: [
          { 
            id_k: Date.now(), 
            sumber: source, 
            nama: target.nama, 
            jabatan: "Pekerjaan ambigu, butuh tinjauan admin", 
            detail: `Hasil pencocokan: Afiliasi ${matchAfiliasi?'Ya':'Tidak'}, Tahun ${matchTahun?'Ya':'Tidak'}, Bidang ${matchBidang?'Ya':'Tidak'}`, 
            skor: skor 
          }
        ]
      });
      logs.unshift({ id: Date.now(), nama: target.nama, query: `"${target.nama}" + "UMM"`, sumber: source, skor: skor, hasil: "Ambigu" });
      
    } else { 
      target.status = 'Tidak Ditemukan';
      target.pekerjaan = 'Tidak ada kecocokan data';
      target.sumber = '-';
      logs.unshift({ id: Date.now(), nama: target.nama, query: `"${target.nama}"`, sumber: source, skor: skor, hasil: "Tidak Cocok" });
    }
    
    countProcessed++;
  });

  refreshUI();
  alert(`Sistem selesai memproses ${countProcessed} alumni baru!\nData telah berpindah ke halaman Data Alumni atau Verifikasi Manual (Skor 60-80).`);
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

function simpanDataBaru() {
  const nama = document.getElementById('input-nama').value.trim();
  const nim = document.getElementById('input-nim').value.trim();
  const tahun = document.getElementById('input-tahun').value.trim();

  if(!nama || !nim || !tahun) {
    alert("Harap isi Nama, NIM, dan Tahun Lulus!");
    return;
  }

  const isDuplicate = data.some(alumni => alumni.nim === nim);
  if (isDuplicate) {
    alert(`Gagal menyimpan! Alumni dengan NIM ${nim} sudah terdaftar di sistem.`);
    return; 
  }

  const newId = Date.now();
  const data = getAlumni();

  data.push({
    id: newId,
    nim: nim,
    nama: nama,
    tahun_lulus: tahun,
    pekerjaan: "-",
    sumber: "-",
    status: "Belum Dilacak"
  });
  
  tutupModal();
  refreshUI();
  
  alert(`Data ${nama} berhasil ditambahkan!\nSilakan buka menu Pelacakan dan tekan "Jalankan Job" untuk melacak data ini.`);
}

function prosesVerifikasi(id_alumni, id_kandidat_valid) {
  const data = getAlumni();
  const queue = getKandidat();
  
  const idx = data.findIndex(a => a.id === id_alumni);
  if(idx !== -1) {
    if(id_kandidat_valid !== null) {
      const k = queue.find(kv => kv.id_alumni === id_alumni).kandidat.find(c => c.id_k === id_kandidat_valid);
      data[idx].status = 'Teridentifikasi';
      data[idx].pekerjaan = k.jabatan;
      data[idx].sumber = k.sumber;
      data[idx].skor = 100; 
    } else {
      data[idx].status = 'Tidak Ditemukan';
      data[idx].pekerjaan = 'Tidak ditemukan (Validasi Admin)';
      data[idx].sumber = '-';
      data[idx].skor = 0;
    }
    
    const kIdx = queue.findIndex(kv => kv.id_alumni === id_alumni);
    if(kIdx !== -1) queue.splice(kIdx, 1);

    refreshUI();
    alert("Data berhasil dikonfirmasi dan masuk ke Data Alumni!");
  }
}

window.onload = () => {
  switchView('dashboard');
  refreshUI();
};