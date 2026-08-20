// ==========================================
// 1. IMPORT MODUL FIREBASE
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot, deleteDoc, updateDoc, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ==========================================
// 2. TAMPAL CONFIG FIREBASE ANDA DI SINI
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDhEer81oa5wGndqr5dKRwFwVeSahwaUjo",
  authDomain: "kurikulum-skfls.firebaseapp.com",
  projectId: "kurikulum-skfls",
  storageBucket: "kurikulum-skfls.firebasestorage.app",
  messagingSenderId: "401976347574",
  appId: "1:401976347574:web:8970f2dab85aa03faf0f17"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ hd: "moe-dl.edu.my" });
const db = getFirestore(app);

window.isAdmin = false;
window.userSemasa = null;

// ==========================================
// 3. LOGIK LOG MASUK (GOOGLE AUTH) & PANGKAT ADMIN
// ==========================================
const senaraiAdmin = [
    "sekolah-4997-cm6@moe-dl.edu.my", 
    "g-12345678@moe-dl.edu.my" 
];

const btnLogin = document.getElementById('btnLogin');
const txtLogin = document.getElementById('txtLogin');
const iconLogin = document.getElementById('iconLogin');

function semakStatusAdmin(email) {
    if (senaraiAdmin.includes(email)) {
        window.isAdmin = true;
        if (typeof sahkanHalamanAdmin === "function") sahkanHalamanAdmin();
        document.querySelectorAll('.hanya-admin').forEach(el => el.classList.remove('hidden'));
    } else {
        window.isAdmin = false;
        if (window.location.pathname.includes('admin.html')) {
            alert("Akses Ditolak. Halaman ini hanya untuk Pentadbir sistem.");
            window.location.href = "index.html";
        }
        document.querySelectorAll('.hanya-admin').forEach(el => el.classList.add('hidden'));
    }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        window.userSemasa = user;
        if (txtLogin) txtLogin.innerText = "Log Keluar";
        if (iconLogin) iconLogin.className = "fas fa-sign-out-alt mr-2 text-red-500";
        semakStatusAdmin(user.email);
        
        // Panggil tracker panitia apabila user berjaya login (untuk dashboard/admin)
        if (document.getElementById('jadualTrackerPanitiaBody')) {
            const tahunSemasa = document.getElementById('filterTahun') ? document.getElementById('filterTahun').value : "2026";
            janaTrackerPanitia(tahunSemasa);
        }
    } else {
        window.userSemasa = null;
        window.isAdmin = false;
        if (txtLogin) txtLogin.innerText = "Log Masuk (DELIMa)";
        if (iconLogin) iconLogin.className = "fas fa-sign-in-alt mr-2 text-slate-600";
        
        if (window.location.pathname.includes('admin.html')) {
            alert("Sila log masuk menggunakan e-mel DELIMa terlebih dahulu.");
            window.location.href = "index.html";
        }
        document.querySelectorAll('.hanya-admin').forEach(el => el.classList.add('hidden'));
    }
});

if (btnLogin) {
    btnLogin.addEventListener('click', () => {
        if (window.userSemasa) {
            signOut(auth).then(() => alert("Anda telah log keluar dengan berjaya.")).catch((error) => console.error("Ralat log keluar:", error));
        } else {
            signInWithPopup(auth, provider).catch((error) => alert("Gagal log masuk: " + error.message));
        }
    });
}

// ==========================================
// 4. KAWALAN TAJUK MUKA SURAT BESAR
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
const subjekSemasa = urlParams.get('subjek') || 'umum';

const senaraiNamaPanitia = {
    'visi_misi': 'Visi, Misi & Matlamat Sekolah', 'spi': 'Surat Pekeliling Ikhtisas (SPI)', 'dasar': 'Dasar & Penetapan Kurikulum', 'takwim': 'Perancangan Pelaksanaan Kurikulum',
    'mesyuarat_induk': 'Mesyuarat Kurikulum Induk', 'mmi': 'Mengurus Masa Instruksional (MMI)',
    'bm': 'Panitia Bahasa Melayu', 'bi': 'Panitia Bahasa Inggeris', 'mt': 'Panitia Matematik', 'sn': 'Panitia Sains', 'pi': 'Panitia Pendidikan Islam', 'pm': 'Panitia Pendidikan Moral',
    'sej': 'Panitia Sejarah', 'rbt': 'Panitia Reka Bentuk & Teknologi', 'psv': 'Panitia Pendidikan Seni Visual', 'mz': 'Panitia Pendidikan Muzik', 'pjpk': 'Panitia PJPK', 'ba': 'Panitia Bahasa Arab',
    'plan': 'Program PLaN', 'pemulihan': 'Pemulihan Khas', 'transisi': 'Program Transisi Tahun 1', 'intervensi_t1': 'Intervensi Tahun 1 (3M)',
    'pss': 'Pusat Sumber Sekolah (PSS)', 'pra': 'Prasekolah'
};

const tajukPanitia = document.getElementById('tajukPanitia');
if (tajukPanitia) {
    tajukPanitia.textContent = senaraiNamaPanitia[subjekSemasa] || 'Senarai Dokumen';
}

// ==========================================
// 5. KAWALAN MENU TELEFON PINTAR (MOBILE)
// ==========================================
const btnMenu = document.getElementById('btnMenu');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

if (btnMenu && sidebar && overlay) {
    btnMenu.addEventListener('click', () => {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
    });
    
    overlay.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    });
}

// ==========================================
// 6. BACA & PAPARKAN JADUAL BERSERTA PENAPISAN (FILTER) TAHUN
// ==========================================
let unsubscribeJadual = null;

function panggilDataJadual(tahunFilter = "Semua") {
    const ruangJadualLama = document.getElementById('ruangJadual'); 
    const ruangFail1 = document.getElementById('ruangFail1');       

    const senaraiIDPanitia = ['bm', 'bi', 'mt', 'sn', 'pi', 'pm', 'sej', 'rbt', 'psv', 'mz', 'pjpk', 'ba'];
    const adakahPanitia = senaraiIDPanitia.includes(subjekSemasa);

    // KEMASKINI UI 1: Sembunyikan 4 fail untuk bukan Panitia, dan sebaliknya
    ['ruangFail1', 'ruangFail2', 'ruangFail3', 'ruangFail4'].forEach(id => {
        const ruang = document.getElementById(id);
        if (ruang) {
            const kadUtama = ruang.closest('.bg-white') || ruang.parentElement.parentElement;
            if (kadUtama) kadUtama.style.display = adakahPanitia ? 'block' : 'none';
        }
    });

    // KEMASKINI UI 2: Sembunyikan kotak putih bawah (Jadual Lama) jika di halaman Panitia
    if (ruangJadualLama) {
        const kadJadualUtama = ruangJadualLama.closest('.bg-white') || ruangJadualLama.parentElement;
        if (kadJadualUtama) {
            kadJadualUtama.style.display = adakahPanitia ? 'none' : 'block';
        }
    }

    // KEMASKINI UI 3: KAWALAN BUTANG MUAT NAIK YANG LEBIH KUKUH
    document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.includes('Muat Naik Bahan') || btn.classList.contains('btn-muat-naik')) {
            if (adakahPanitia) {
                btn.style.display = 'none'; 
                btn.classList.add('hidden');
            } else {
                // Gunakan inline-flex supaya bentuk asal butang (ikon + teks) tidak hancur
                btn.style.display = 'inline-flex'; 
                btn.classList.remove('hidden');
            }
        }
    });

    let syarat = [
        where("subjek", "==", subjekSemasa),
        where("status", "==", "aktif")
    ];

    if (tahunFilter !== "Semua") {
        syarat.push(where("tahun", "==", tahunFilter));
    }
    
    syarat.push(orderBy("tarikh", "desc"));
    const q = query(collection(db, "kandungan"), ...syarat);
    
    if (unsubscribeJadual) unsubscribeJadual();

    unsubscribeJadual = onSnapshot(q, (snapshot) => {

        // --- KES 1: HALAMAN PANITIA SUBJEK (4 FAIL) ---
        if (adakahPanitia && ruangFail1) {
            let htmlFail = { fail_1: "", fail_2: "", fail_3: "", fail_4: "" };
            let jumlahFail = { fail_1: 0, fail_2: 0, fail_3: 0, fail_4: 0 };

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const id = docSnap.id;
                const folderDocs = data.folder_destinasi || 'fail_1';

                let rowHTML = `
                    <div class="flex justify-between items-center border-b border-slate-100 py-3 hover:bg-slate-50">
                        <div>
                            <p class="font-medium text-slate-800"><i class="fas fa-file-pdf text-red-500 mr-2"></i> ${data.tajuk}</p>
                            <p class="text-xs text-slate-500">Kategori: ${data.kategori || '-'} | Tahun: ${data.tahun || '-'} | Oleh: ${data.dimuat_naik_oleh}</p>
                        </div>
                        <div class="whitespace-nowrap ml-4">
                            <a href="${data.url_fail}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm font-bold mr-3">Buka</a>
                            <button onclick="padamRekod('${id}')" class="hanya-admin hidden text-red-600 hover:text-red-800 text-sm font-bold" title="Padam">Padam</button>
                        </div>
                    </div>
                `;
                
                if (htmlFail[folderDocs] !== undefined) {
                    htmlFail[folderDocs] += rowHTML;
                    jumlahFail[folderDocs]++;
                }
            });

            ['fail_1', 'fail_2', 'fail_3', 'fail_4'].forEach((f, index) => {
                const ruang = document.getElementById(`ruangFail${index + 1}`);
                if (ruang) {
                    ruang.innerHTML = jumlahFail[f] > 0 ? htmlFail[f] : '<p class="text-slate-400 text-sm py-2 italic">Belum ada bahan.</p>';
                }
            });
        } 
        
        // --- KES 2: BUKAN PANITIA (JADUAL TUNGGAL) ---
        else if (ruangJadualLama) {
            if (snapshot.empty) {
                ruangJadualLama.innerHTML = '<p class="text-center text-slate-400 py-10"><i class="fas fa-folder-open text-4xl mb-3 block"></i> Belum ada bahan dimuat naik.</p>';
                return;
            }

            let htmlJadual = `
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-100 text-slate-600 text-sm border-b border-slate-200">
                            <th class="p-4 font-medium rounded-tl-lg">Tajuk Dokumen</th>
                            <th class="p-4 font-medium hidden md:table-cell">Tahun</th>
                            <th class="p-4 font-medium hidden md:table-cell">Kategori</th>
                            <th class="p-4 font-medium hidden md:table-cell">Dimuat Naik Oleh</th>
                            <th class="p-4 font-medium">Tarikh</th>
                            <th class="p-4 font-medium text-right rounded-tr-lg">Tindakan</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm">
            `;

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const id = docSnap.id;
                let tarikhMasa = data.tarikh ? data.tarikh.toDate().toLocaleDateString('ms-MY') : "Baru sahaja";

                htmlJadual += `
                    <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td class="p-4 font-medium text-slate-800"><i class="fas fa-file-alt text-blue-500 mr-2 text-lg"></i> ${data.tajuk}</td>
                        <td class="p-4 text-slate-500 hidden md:table-cell"><span class="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">${data.tahun || 'Tiada'}</span></td>
                        <td class="p-4 text-slate-500 hidden md:table-cell">${data.kategori || '-'}</td>
                        <td class="p-4 text-slate-500 hidden md:table-cell">${data.dimuat_naik_oleh}</td>
                        <td class="p-4 text-slate-500">${tarikhMasa}</td>
                        <td class="p-4 text-right whitespace-nowrap">
                            <a href="${data.url_fail}" target="_blank" class="inline-block bg-blue-100 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-200 transition text-xs font-bold mr-2">Buka</a>
                            <button onclick="padamRekod('${id}')" class="hanya-admin hidden bg-red-100 text-red-700 px-3 py-2 rounded-md hover:bg-red-200 transition text-xs font-bold" title="Padam"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });

            htmlJadual += `</tbody></table></div>`;
            ruangJadualLama.innerHTML = htmlJadual;
        }

        if (window.isAdmin) document.querySelectorAll('.hanya-admin').forEach(el => el.classList.remove('hidden'));
    });
}

window.padamRekod = async function(id) {
    if (confirm("Adakah anda pasti mahu memadam fail ini?")) {
        await updateDoc(doc(db, "kandungan", id), { status: "dipadam" });
    }
}

const filterDropdownTahunAwal = document.getElementById('filterTahun');
const tahunAwal = filterDropdownTahunAwal ? filterDropdownTahunAwal.value : "Semua";
panggilDataJadual(tahunAwal);

// ==========================================
// 7. LOGIK MUAT NAIK FAIL (PENGASINGAN FOLDER & KATEGORI)
// ==========================================
const modalUpload = document.getElementById('modalUpload');
const btnTutupModal = document.getElementById('btnTutupModal');
const formUpload = document.getElementById('formUpload');
const btnSubmitUpload = document.getElementById('btnSubmitUpload');
const txtSubmit = document.getElementById('txtSubmit');
let folderSasaranSemasa = "fail_1"; 

// Buka modal dari mana-mana butang muat naik
document.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn && (btn.textContent.includes('Muat Naik') || btn.classList.contains('btn-muat-naik'))) {
        if (!window.userSemasa) return alert("Sila Log Masuk (DELIMa) terlebih dahulu.");
        
        folderSasaranSemasa = btn.getAttribute('data-folder') || "umum"; 
        if (modalUpload) modalUpload.classList.remove('hidden');
    }
});

if (btnTutupModal) {
    btnTutupModal.addEventListener('click', () => { 
        modalUpload.classList.add('hidden'); 
        if(formUpload) formUpload.reset(); 
    });
}

if (formUpload) {
    formUpload.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const file = document.getElementById('inputFail').files[0];
        const tajuk = document.getElementById('inputTajuk').value;
        const kategori = document.getElementById('inputKategori').value; 
        const tahunDipilih = document.getElementById('inputTahun').value;
        const user = auth.currentUser;

        if (!file || !user) return;
        if (!kategori) return alert("Sila pilih Kategori Dokumen!"); 
        if (file.size > (15 * 1024 * 1024)) return alert("Saiz fail melebihi 15MB.");

        try {
            btnSubmitUpload.disabled = true;
            txtSubmit.innerHTML = 'Memproses...';

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async function() {
                const base64Data = reader.result.split(',')[1]; 
                const gasUrl = "https://script.google.com/macros/s/AKfycbyAeUulIKI140BefI4ovGqmzrifbPKJ5USstIoCZ-mV_OzH4PfR8d3cjxfJGy572zYxbg/exec";
                
                const responsGAS = await fetch(gasUrl, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({ filename: file.name, mimeType: file.type, base64: base64Data })
                });
                const hasilGAS = await responsGAS.json();

                if (hasilGAS.status === 'success') {
                    await addDoc(collection(db, "kandungan"), {
                        tajuk: tajuk, 
                        kategori: kategori, 
                        subjek: subjekSemasa, 
                        folder_destinasi: folderSasaranSemasa, 
                        url_fail: hasilGAS.url,
                        dimuat_naik_oleh: user.displayName, 
                        tarikh: serverTimestamp(),
                        tahun: tahunDipilih,
                        status: "aktif"
                    });
                    
                    alert("Berjaya dimuat naik!");
                    modalUpload.classList.add('hidden');
                    formUpload.reset();
                }
                btnSubmitUpload.disabled = false;
                txtSubmit.innerHTML = 'Muat Naik Sekarang';
            };
        } catch (error) {
            alert("Ralat: " + error.message);
            btnSubmitUpload.disabled = false;
        }
    });
}

// ==========================================
// 8. LOGIK CARIAN GLOBAL
// ==========================================
const inputCarian = document.getElementById('inputCarian');
const modalCarian = document.getElementById('modalCarian');
const btnTutupCarian = document.getElementById('btnTutupCarian');
const ruangHasilCarian = document.getElementById('ruangHasilCarian');

if (inputCarian && modalCarian) {
    inputCarian.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const keyword = inputCarian.value.toLowerCase();
            if(keyword.length < 3) {
                alert("Sila taip sekurang-kurangnya 3 huruf untuk mencari.");
                return;
            }
            
            modalCarian.classList.remove('hidden');
            ruangHasilCarian.innerHTML = '<p class="text-center text-slate-500 py-10"><i class="fas fa-spinner fa-spin text-3xl mb-3 block"></i>Sedang menapis dokumen...</p>';
            
            try {
                const qSearch = query(collection(db, "kandungan"), where("status", "==", "aktif"));
                const querySnapshot = await getDocs(qSearch);
                
                let hasilHTML = `<table class="w-full text-left border-collapse"><tbody>`;
                let jumlahJumpa = 0;

                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    const tajukKecil = data.tajuk.toLowerCase();
                    
                    if(tajukKecil.includes(keyword)) {
                        jumlahJumpa++;
                        hasilHTML += `
                            <tr class="border-b hover:bg-slate-50">
                                <td class="p-3">
                                    <p class="font-bold text-slate-800 text-base">${data.tajuk}</p>
                                    <p class="text-xs text-slate-500 mt-1">
                                        <span class="bg-slate-200 px-2 py-0.5 rounded mr-2">Folder: ${senaraiNamaPanitia[data.subjek] || data.subjek}</span> 
                                        Tahun: ${data.tahun || 'Tiada'}
                                    </p>
                                </td>
                                <td class="p-3 text-right">
                                    <a href="${data.url_fail}" target="_blank" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm">Buka</a>
                                </td>
                            </tr>
                        `;
                    }
                });

                if(jumlahJumpa === 0) {
                    ruangHasilCarian.innerHTML = '<div class="text-center py-10"><i class="fas fa-search-minus text-4xl text-slate-300 mb-3 block"></i><p class="text-slate-500">Tiada fail dijumpai.</p></div>';
                } else {
                    hasilHTML += `</tbody></table>`;
                    ruangHasilCarian.innerHTML = `<div class="bg-emerald-50 text-emerald-700 p-3 rounded-lg mb-4 text-sm font-bold border border-emerald-200"><i class="fas fa-check-circle mr-2"></i> ${jumlahJumpa} dokumen dijumpai.</div>` + hasilHTML;
                }
            } catch (error) {
                ruangHasilCarian.innerHTML = `<p class="text-red-500 text-center py-10">Ralat carian: ${error.message}</p>`;
            }
        }
    });

    if (btnTutupCarian) {
        btnTutupCarian.addEventListener('click', () => {
            modalCarian.classList.add('hidden');
        });
    }
}

// ==========================================
// 9. LOGIK ADMIN CONSOLE (ARKIB)
// ==========================================
const adminContent = document.getElementById('adminContent');
const ruangArkib = document.getElementById('ruangArkib');

function sahkanHalamanAdmin() {
    if (window.location.pathname.includes('admin.html')) {
        if (window.isAdmin) {
            if(adminContent) adminContent.style.display = 'block';
            panggilDataArkib();
        } else {
            alert("Akses Ditolak. Halaman ini hanya untuk Pentadbir (Admin) sistem.");
            window.location.href = "index.html";
        }
    }
}

function panggilDataArkib() {
    if (!ruangArkib) return;
    
    const qArkib = query(collection(db, "kandungan"), where("status", "==", "dipadam"), orderBy("tarikh", "desc"));
    
    onSnapshot(qArkib, (snapshot) => {
        if (snapshot.empty) {
            ruangArkib.innerHTML = '<p class="text-center text-slate-500 py-10">Tiada fail di dalam tong sampah setakat ini.</p>';
            return;
        }

        let htmlArkib = `
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-slate-100 text-slate-600 text-sm border-b border-slate-200">
                        <th class="p-4 font-medium">Tajuk Fail (Asal)</th>
                        <th class="p-4 font-medium hidden md:table-cell">Dipadam Oleh</th>
                        <th class="p-4 font-medium text-right">Tindakan Admin</th>
                    </tr>
                </thead>
                <tbody class="text-sm">
        `;

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;

            htmlArkib += `
                <tr class="border-b border-slate-100 hover:bg-slate-50">
                    <td class="p-4">
                        <p class="font-bold text-slate-800">${data.tajuk}</p>
                        <p class="text-xs text-slate-500">Folder Asal: ${senaraiNamaPanitia[data.subjek] || data.subjek} | Tahun: ${data.tahun}</p>
                    </td>
                    <td class="p-4 text-slate-500 hidden md:table-cell">${data.dimuat_naik_oleh}</td>
                    <td class="p-4 text-right whitespace-nowrap">
                        <button onclick="kembalikanFail('${id}')" class="bg-emerald-100 text-emerald-700 px-3 py-2 rounded-md hover:bg-emerald-200 transition text-xs font-bold mr-2"><i class="fas fa-undo mr-1"></i>Pulihkan</button>
                        <button onclick="padamKekalFail('${id}')" class="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition text-xs font-bold"><i class="fas fa-trash mr-1"></i>Padam Kekal</button>
                    </td>
                </tr>
            `;
        });

        htmlArkib += `</tbody></table></div>`;
        ruangArkib.innerHTML = htmlArkib;
    });
}

window.kembalikanFail = async function(id) {
    if (confirm("Adakah anda pasti mahu memulihkan fail ini? Ia akan dikembalikan ke folder asalnya.")) {
        await updateDoc(doc(db, "kandungan", id), { status: "aktif" });
        alert("Berjaya dipulihkan.");
    }
}

window.padamKekalFail = async function(id) {
    if (confirm("AMARAN: Fail akan dipadam sepenuhnya dari pangkalan data dan tidak boleh dikembalikan. Teruskan?")) {
        await deleteDoc(doc(db, "kandungan", id));
        alert("Fail telah dipadam kekal.");
    }
}

// ==========================================
// 10. JADUAL TRACKER PANITIA (KESELURUHAN SUBJEK & KIRAAN FAIL)
// ==========================================
async function janaTrackerPanitia(tahun) {
    const kotakTracker = document.getElementById('kotakTrackerPanitia');
    const jadualTrackerPanitiaBody = document.getElementById('jadualTrackerPanitiaBody');
    const labelTahunTracker = document.getElementById('labelTahunTracker');

    if (!jadualTrackerPanitiaBody || !kotakTracker) return; 

    // Tentukan adakah tracker ini patut dipaparkan
    const pathName = window.location.pathname.toLowerCase();
    const isDashboardOrAdmin = pathName.endsWith('/') || pathName.endsWith('index.html') || pathName.includes('admin.html');
    
    // Hanya tunjukkan di Dashboard Utama ('umum') atau muka surat admin
    if (!isDashboardOrAdmin || (subjekSemasa !== 'umum' && !pathName.includes('admin.html'))) {
        kotakTracker.style.display = 'none';
        return;
    } else {
        kotakTracker.style.display = 'block';
    }

    if (labelTahunTracker) labelTahunTracker.innerText = tahun;
    jadualTrackerPanitiaBody.innerHTML = '<tr><td colspan="6" class="text-center p-8 text-slate-500"><i class="fas fa-spinner fa-spin text-2xl mb-2 block"></i>Mengira jumlah fail...</td></tr>';

    const senaraiSemuaPanitia = [
        { id: "bm", nama: "B. Melayu" },
        { id: "bi", nama: "B. Inggeris" },
        { id: "mt", nama: "Matematik" },
        { id: "sn", nama: "Sains" },
        { id: "pi", nama: "Pendidikan Islam" },
        { id: "pm", nama: "Pendidikan Moral" },
        { id: "sej", nama: "Sejarah" },
        { id: "rbt", nama: "RBT" },
        { id: "psv", nama: "Pend. Seni Visual" },
        { id: "mz", nama: "Pend. Muzik" },
        { id: "pjpk", nama: "PJPK" },
        { id: "ba", nama: "B. Arab" }
    ];

    try {
        let queryTracker = [where("status", "==", "aktif")];
        if (tahun !== "Semua") {
            queryTracker.push(where("tahun", "==", tahun));
        }

        const qTracker = query(collection(db, "kandungan"), ...queryTracker);
        const querySnapshot = await getDocs(qTracker);

        // Sediakan objek kosong untuk mengira setiap subjek
        let dataSubjek = {};
        senaraiSemuaPanitia.forEach(p => {
            dataSubjek[p.id] = { fail_1: 0, fail_2: 0, fail_3: 0, fail_4: 0 };
        });

        // Masukkan data ke dalam objek mengikut subjek dan folder
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const subjek = data.subjek;
            const folder = data.folder_destinasi; 

            if (dataSubjek[subjek] && dataSubjek[subjek][folder] !== undefined) {
                dataSubjek[subjek][folder]++;
            }
        });

        // Hasilkan HTML (Tanda Tick beserta bilangan fail)
        let htmlTracker = "";
        
        senaraiSemuaPanitia.forEach(p => {
            const kiraan = dataSubjek[p.id];
            
            // Fungsi kecil untuk format kotak: "✅ (2)" atau "❌ (0)"
            const formatKotak = (jumlah) => {
                if (jumlah > 0) {
                    return `<span class="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200"><i class="fas fa-check"></i> (${jumlah})</span>`;
                } else {
                    return `<span class="text-slate-400 bg-slate-50 px-2 py-1 rounded"><i class="fas fa-times"></i> (0)</span>`;
                }
            };

            const lengkapSemua = (kiraan.fail_1 > 0 && kiraan.fail_2 > 0 && kiraan.fail_3 > 0 && kiraan.fail_4 > 0);
            const statusLengkap = lengkapSemua 
                ? '<span class="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-200 shadow-sm"><i class="fas fa-check-circle mr-1"></i>Lengkap</span>' 
                : '<span class="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold border border-amber-200">Belum Lengkap</span>';

            htmlTracker += `
                <tr class="hover:bg-slate-50 border-b border-slate-100 transition duration-150">
                    <td class="p-3 font-medium text-slate-700 border-r border-slate-50">${p.nama}</td>
                    <td class="p-3 text-center border-r border-slate-50">${formatKotak(kiraan.fail_1)}</td>
                    <td class="p-3 text-center border-r border-slate-50">${formatKotak(kiraan.fail_2)}</td>
                    <td class="p-3 text-center border-r border-slate-50">${formatKotak(kiraan.fail_3)}</td>
                    <td class="p-3 text-center border-r border-slate-50">${formatKotak(kiraan.fail_4)}</td>
                    <td class="p-3 text-center">${statusLengkap}</td>
                </tr>
            `;
        });

        jadualTrackerPanitiaBody.innerHTML = htmlTracker;

    } catch (error) {
        console.error("Ralat Tracker Panitia:", error);
        jadualTrackerPanitiaBody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-red-500">Ralat: ${error.message}</td></tr>`;
    }
}

// PENGGERAK JADUAL & PENAPIS (FILTER)
const filterTahunSistem = document.getElementById('filterTahun');
if (filterTahunSistem) {
    filterTahunSistem.addEventListener('change', (e) => {
        if(document.getElementById('jadualTrackerPanitiaBody')) janaTrackerPanitia(e.target.value);
        panggilDataJadual(e.target.value);
    });
}
