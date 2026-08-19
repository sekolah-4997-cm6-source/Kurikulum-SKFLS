// ==========================================
// 1. IMPORT MODUL FIREBASE
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot, deleteDoc, updateDoc, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";// ==========================================
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
const db = getFirestore(app);

window.isAdmin = false;

// ==========================================
// 3. LOGIK LOG MASUK (GOOGLE AUTH) & PANGKAT ADMIN
// ==========================================
// Pastikan baris import auth ada di bahagian paling atas fail app.js anda (Bahagian 1)
// import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Senarai emel admin (Tukar kepada emel DELIMa sebenar Cikgu / Admin)
const senaraiAdmin = [
    "sekolah-4997-cm6@moe-dl.edu.my", 
    "g-12345678@moe-dl.edu.my" 
];

window.isAdmin = false;
window.userSemasa = null;

const btnLogin = document.getElementById('btnLogin');
const txtLogin = document.getElementById('txtLogin');
const iconLogin = document.getElementById('iconLogin');

// Fungsi Semak Admin (Dikemaskini untuk menyokong admin.html)
function semakStatusAdmin(email) {
    if (senaraiAdmin.includes(email)) {
        window.isAdmin = true;
        
        // Panggil fungsi sahkan halaman jika berada di page admin.html
        if (typeof sahkanHalamanAdmin === "function") {
            sahkanHalamanAdmin();
        }
        
        // Tunjuk semua butang admin di paparan awam
        document.querySelectorAll('.hanya-admin').forEach(el => {
            el.classList.remove('hidden');
        });
    } else {
        window.isAdmin = false;
        
        // Halang bukan admin masuk ke admin.html dan tendang ke index.html
        if (window.location.pathname.includes('admin.html')) {
            alert("Akses Ditolak. Halaman ini hanya untuk Pentadbir sistem.");
            window.location.href = "index.html";
        }
        
        // Sembunyikan butang admin untuk user biasa
        document.querySelectorAll('.hanya-admin').forEach(el => {
            el.classList.add('hidden');
        });
    }
}

// Pantau status log masuk pengguna (Live)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Jika User sudah log masuk
        window.userSemasa = user;
        if (txtLogin) txtLogin.innerText = "Log Keluar";
        if (iconLogin) iconLogin.className = "fas fa-sign-out-alt mr-2 text-red-500";
        
        // Semak adakah user ini admin
        semakStatusAdmin(user.email);
        
    } else {
        // Jika User belum log masuk
        window.userSemasa = null;
        window.isAdmin = false;
        if (txtLogin) txtLogin.innerText = "Log Masuk (DELIMa)";
        if (iconLogin) iconLogin.className = "fas fa-sign-in-alt mr-2 text-slate-600";
        
        // Halang sesiapa yang tak login dari akses admin.html
        if (window.location.pathname.includes('admin.html')) {
            alert("Sila log masuk menggunakan e-mel DELIMa terlebih dahulu.");
            window.location.href = "index.html";
        }
        
        // Sembunyikan butang admin
        document.querySelectorAll('.hanya-admin').forEach(el => {
            el.classList.add('hidden');
        });
    }
});

// Fungsi klik butang Log Masuk / Log Keluar
if (btnLogin) {
    btnLogin.addEventListener('click', () => {
        if (window.userSemasa) {
            // Proses log keluar
            signOut(auth).then(() => {
                alert("Anda telah log keluar dengan berjaya.");
            }).catch((error) => {
                console.error("Ralat log keluar:", error);
            });
        } else {
            // Proses log masuk
            signInWithPopup(auth, provider).then((result) => {
                // Log masuk berjaya, onAuthStateChanged akan uruskan UI
            }).catch((error) => {
                console.error("Ralat log masuk:", error);
                alert("Gagal log masuk: " + error.message);
            });
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
// 6. BACA & PAPARKAN JADUAL SECARA LIVE (DENGAN FILTER & PAGINATION)
// ==========================================
const ruangJadual = document.getElementById('ruangJadual');
const filterTahun = document.getElementById('filterTahun');
let limitFail = 20; 
let unsubscribeJadual = null;

function panggilDataJadual() {
    if (!ruangJadual) return;
    
    let syarat = [
        where("subjek", "==", subjekSemasa),
        where("status", "==", "aktif"),
        orderBy("tarikh", "desc"),
        limit(limitFail)
    ];

    if (filterTahun && filterTahun.value !== 'semua') {
        syarat.push(where("tahun", "==", filterTahun.value));
    }

    const q = query(collection(db, "kandungan"), ...syarat);
    
    if (unsubscribeJadual) unsubscribeJadual();

    unsubscribeJadual = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            ruangJadual.innerHTML = '<p class="text-center text-slate-400 py-10"><i class="fas fa-folder-open text-4xl mb-3 block"></i> Belum ada bahan dimuat naik (atau tiada fail untuk tahun ini).</p>';
            return;
        }

        let htmlJadual = `
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-slate-100 text-slate-600 text-sm border-b border-slate-200">
                        <th class="p-4 font-medium rounded-tl-lg">Tajuk Dokumen</th>
                        <th class="p-4 font-medium hidden md:table-cell">Tahun</th>
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
            let tarikhMasa = "Baru sahaja";
            if (data.tarikh) tarikhMasa = data.tarikh.toDate().toLocaleDateString('ms-MY');

            htmlJadual += `
                <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td class="p-4 font-medium text-slate-800">
                        <i class="fas fa-file-alt text-blue-500 mr-2 text-lg"></i> ${data.tajuk}
                    </td>
                    <td class="p-4 text-slate-500 hidden md:table-cell"><span class="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">${data.tahun || 'Tiada Tag'}</span></td>
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
        
        htmlJadual += `
            <div class="p-4 text-center border-t border-slate-100 bg-slate-50">
                <button onclick="tambahLimit()" class="text-sm font-medium text-blue-600 hover:text-blue-800 transition">
                    <i class="fas fa-chevron-down mr-1"></i> Papar Fail Lebih Lama (Maks: ${limitFail})
                </button>
            </div>
        `;
        
        ruangJadual.innerHTML = htmlJadual;

        if (window.isAdmin) {
            document.querySelectorAll('.hanya-admin').forEach(el => el.classList.remove('hidden'));
        }
    });
}

if(filterTahun) {
    filterTahun.addEventListener('change', () => {
        limitFail = 20; 
        panggilDataJadual();
    });
}

window.tambahLimit = function() {
    limitFail += 20; 
    panggilDataJadual();
}

window.padamRekod = async function(id) {
    if (confirm("Adakah anda pasti mahu memadam fail ini? (Fail akan disimpan dalam arkib admin)")) {
        const docRef = doc(db, "kandungan", id);
        await updateDoc(docRef, {
            status: "dipadam"
        });
    }
}

panggilDataJadual();
// ==========================================
// 7. LOGIK MUAT NAIK FAIL (UPLOAD)
// ==========================================
const modalUpload = document.getElementById('modalUpload');
const btnBukaModal = document.getElementById('btnBukaModal');
const btnTutupModal = document.getElementById('btnTutupModal');
const formUpload = document.getElementById('formUpload');
const btnSubmitUpload = document.getElementById('btnSubmitUpload');
const txtSubmit = document.getElementById('txtSubmit');

if (btnBukaModal && modalUpload && btnTutupModal) {
    btnBukaModal.addEventListener('click', () => modalUpload.classList.remove('hidden'));
    btnTutupModal.addEventListener('click', () => { modalUpload.classList.add('hidden'); if(formUpload) formUpload.reset(); });
}

if (formUpload) {
    formUpload.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const file = document.getElementById('inputFail').files[0];
        const tajuk = document.getElementById('inputTajuk').value;
        const user = auth.currentUser;

        if (!file || !user) return;

        try {
            btnSubmitUpload.disabled = true;
            btnSubmitUpload.classList.replace('bg-blue-600', 'bg-slate-400');
            txtSubmit.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Memproses...';

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async function() {
                const base64Data = reader.result.split(',')[1]; 
                const gasUrl = "https://script.google.com/macros/s/AKfycbxJgaxqjiSwkBcr-v9ICWtYOwc8zbtLO3qHE4ptVPPNPUkGVg86PlKcjD9K1thpz6XX5g/exec";
                
                const responsGAS = await fetch(gasUrl, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({ filename: file.name, mimeType: file.type, base64: base64Data })
                });
                
                const hasilGAS = await responsGAS.json();

                if (hasilGAS.status === 'success') {
                  // Gantikan blok addDoc sedia ada dengan ini:
const tahunDipilih = document.getElementById('inputTahun').value;

await addDoc(collection(db, "kandungan"), {
    tajuk: tajuk, 
    subjek: subjekSemasa, 
    url_fail: hasilGAS.url,
    dimuat_naik_oleh: user.displayName, 
    uid_pemuat_naik: user.uid, 
    tarikh: serverTimestamp(),
    tahun: tahunDipilih, // Tagging Tahun
    status: "aktif"      // Status untuk Soft Delete
});
                    modalUpload.classList.add('hidden');
                    formUpload.reset();
                } else {
                    alert("Ralat Drive: " + hasilGAS.message);
                }
                btnSubmitUpload.disabled = false;
                btnSubmitUpload.classList.replace('bg-slate-400', 'bg-blue-600');
                txtSubmit.innerHTML = 'Muat Naik Sekarang';
            };
        } catch (error) {
            alert("Ralat: " + error.message);
            btnSubmitUpload.disabled = false;
            btnSubmitUpload.classList.replace('bg-slate-400', 'bg-blue-600');
            txtSubmit.innerHTML = 'Cuba Lagi';
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
                // Tarik fail aktif dan tapis
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
                                        <span class="bg-slate-200 px-2 py-0.5 rounded mr-2">Folder: ${data.subjek}</span> 
                                        Tahun: ${data.tahun || 'Tiada'}
                                    </p>
                                </td>
                                <td class="p-3 text-right">
                                    <a href="${data.url_fail}" target="_blank" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm">Buka Dokumen</a>
                                </td>
                            </tr>
                        `;
                    }
                });

                if(jumlahJumpa === 0) {
                    ruangHasilCarian.innerHTML = '<div class="text-center py-10"><i class="fas fa-search-minus text-4xl text-slate-300 mb-3 block"></i><p class="text-slate-500">Tiada fail dijumpai dengan kata kunci tersebut.</p></div>';
                } else {
                    hasilHTML += `</tbody></table>`;
                    ruangHasilCarian.innerHTML = `<div class="bg-emerald-50 text-emerald-700 p-3 rounded-lg mb-4 text-sm font-bold border border-emerald-200"><i class="fas fa-check-circle mr-2"></i> ${jumlahJumpa} dokumen dijumpai.</div>` + hasilHTML;
                }
            } catch (error) {
                ruangHasilCarian.innerHTML = `<p class="text-red-500 text-center py-10">Ralat carian: ${error.message}</p>`;
            }
        }
    });

    btnTutupCarian.addEventListener('click', () => {
        modalCarian.classList.add('hidden');
    });
}
    });
  // ==========================================
// 9. LOGIK ADMIN CONSOLE (ARKIB & TRACKER)
// ==========================================
const adminContent = document.getElementById('adminContent');
const ruangArkib = document.getElementById('ruangArkib');

// Fungsi untuk cek adakah user berada di page admin dan adakah dia benar-benar admin
function sahkanHalamanAdmin() {
    if (window.location.pathname.includes('admin.html')) {
        if (window.isAdmin) {
            // Jika dia admin, tunjukkan kandungan
            if(adminContent) adminContent.style.display = 'block';
            panggilDataArkib();
            panggilDataTracker();
        } else {
            // Jika bukan admin, beri amaran dan halau balik ke index
            alert("Akses Ditolak. Halaman ini hanya untuk Pentadbir (Admin) sistem.");
            window.location.href = "index.html";
        }
    }
}

// Fungsi panggil fail yang berstatus "dipadam"
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
                        <p class="text-xs text-slate-500">Folder Asal: ${data.subjek} | Tahun: ${data.tahun}</p>
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

// Fungsi Pulihkan Fail (Tukar status kembali kepada 'aktif')
window.kembalikanFail = async function(id) {
    if (confirm("Adakah anda pasti mahu memulihkan fail ini? Ia akan dikembalikan ke folder asalnya.")) {
        const docRef = doc(db, "kandungan", id);
        await updateDoc(docRef, { status: "aktif" });
        alert("Berjaya dipulihkan.");
    }
}

// Fungsi Padam Kekal dari Database
window.padamKekalFail = async function(id) {
    if (confirm("AMARAN: Fail akan dipadam sepenuhnya dari pangkalan data dan tidak boleh dikembalikan. Teruskan?")) {
        const docRef = doc(db, "kandungan", id);
        await deleteDoc(docRef);
        alert("Fail telah dipadam kekal.");
    }
}
  // ==========================================
// 10. LOGIK AUTOMATIK CHECKLIST TRACKER
// ==========================================
const jadualTracker = document.getElementById('jadualTracker');

async function panggilDataTracker() {
    if (!jadualTracker) return;

    // Tunjuk animasi loading sementara menyemak fail
    jadualTracker.innerHTML = '<tr><td colspan="5" class="text-center p-8 text-slate-500"><i class="fas fa-spinner fa-spin text-2xl mb-2 block"></i>Sedang menyemak fail panitia...</td></tr>';

    const tahunSemasa = new Date().getFullYear().toString(); // Akan ambil tahun 2026 secara automatik

    // Senarai ID folder subjek yang sistem perlu pantau
    // (Nota: Pastikan 'id' ini sama dengan value yang anda set dalam dropdown muat naik fail)
    const senaraiSubjek = [
        { id: "bm", nama: "Bahasa Melayu" },
        { id: "bi", nama: "Bahasa Inggeris" },
        { id: "mt", nama: "Matematik" },
        { id: "sn", nama: "Sains" }
        // Anda boleh tambah subjek lain seperti sejarah, pjk dll di sini nanti
    ];

    try {
        // Minta pangkalan data keluarkan HANYA fail tahun 2026 yang 'aktif' untuk jimat kuota
        const qTracker = query(collection(db, "kandungan"), where("status", "==", "aktif"), where("tahun", "==", tahunSemasa));
        const querySnapshot = await getDocs(qTracker);

        // Sediakan "Kertas Kosong" (Objek) untuk catat status setiap subjek
        let statusPanitia = {};
        senaraiSubjek.forEach(sub => {
            statusPanitia[sub.id] = { rpt: false, minit: false, kertasKerja: false };
        });

        // Loop setiap fail yang dijumpai dan semak tajuknya
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const subjekFail = data.subjek;
            const tajuk = data.tajuk.toLowerCase(); // Tukar huruf kecil supaya carian tepat

            // Jika fail itu kepunyaan subjek yang ada dalam senarai pemantauan
            if (statusPanitia[subjekFail]) {
                // Semak kata kunci dalam tajuk fail
                if (tajuk.includes("rpt") || tajuk.includes("dskp") || tajuk.includes("rancangan pelajaran")) {
                    statusPanitia[subjekFail].rpt = true;
                }
                if (tajuk.includes("minit") || tajuk.includes("mesyuarat")) {
                    statusPanitia[subjekFail].minit = true;
                }
                if (tajuk.includes("kertas kerja")) {
                    statusPanitia[subjekFail].kertasKerja = true;
                }
            }
        });

        // Selepas selesai semak semua fail, mari kita bina baris jadual (HTML)
        let htmlTracker = "";
        
        senaraiSubjek.forEach(sub => {
            const status = statusPanitia[sub.id];
            
            // Tetapan Ikon
            const iconHijau = '<i class="fas fa-check-circle text-lg text-emerald-600"></i>';
            const iconMerah = '<i class="fas fa-times-circle text-lg text-red-300"></i>';

            const rptIcon = status.rpt ? iconHijau : iconMerah;
            const minitIcon = status.minit ? iconHijau : iconMerah;
            const kertasIcon = status.kertasKerja ? iconHijau : iconMerah;

            // Semak status keseluruhan (Jika ketiga-tiganya True = Lengkap)
            const lengkap = status.rpt && status.minit && status.kertasKerja;
            const badgeStatus = lengkap 
                ? '<span class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold"><i class="fas fa-star mr-1"></i>Lengkap</span>' 
                : '<span class="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">Tidak Lengkap</span>';

            htmlTracker += `
                <tr class="hover:bg-slate-50 transition">
                    <td class="p-3 border border-slate-200 font-bold text-slate-700">${sub.nama}</td>
                    <td class="p-3 border border-slate-200 text-center">${rptIcon}</td>
                    <td class="p-3 border border-slate-200 text-center">${minitIcon}</td>
                    <td class="p-3 border border-slate-200 text-center">${kertasIcon}</td>
                    <td class="p-3 border border-slate-200 text-center">${badgeStatus}</td>
                </tr>
            `;
        });

        // Masukkan HTML ke dalam jadual
        jadualTracker.innerHTML = htmlTracker;

    } catch (error) {
        console.error("Ralat Tracker:", error);
        jadualTracker.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-red-500">Gagal memuatkan rekod pemantauan: ${error.message}</td></tr>`;
    }
}
}
