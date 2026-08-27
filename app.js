// ==========================================
// 1. IMPORT MODUL FIREBASE
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot, deleteDoc, updateDoc, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ==========================================
// 2. CONFIG FIREBASE
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

// Pembolehubah Global
window.isAdmin = false;
window.userSemasa = null;
let tahunFilter = "Semua"; 
let unsubscribeJadual = null; 
let unsubscribeTracker = null;

// ==========================================
// 3. LOGIK LOG MASUK & PERANAN PENGGUNA (FIRESTORE)
// ==========================================
const btnLogin = document.getElementById('btnLogin');
const txtLogin = document.getElementById('txtLogin');
const iconLogin = document.getElementById('iconLogin');

// Fungsi Pintar Semak Akses (BAHARU - Sokong Pelbagai Peranan)
window.semakKebenaranAkses = function(subjekDiuji) {
    if (window.isAdmin) return true; // Admin sentiasa boleh
    
    // Semak jika pengguna mempunyai 'akses_khas' dan kawasan mereka (Array) mengandungi subjek yang diuji
    if (window.userRole === "akses_khas" && Array.isArray(window.userKawalan) && window.userKawalan.includes(subjekDiuji)) {
        return true; 
    }
    return false; 
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // 1. Semak domain DELIMa
        if (!user.email.endsWith("@moe-dl.edu.my")) {
            alert("Sila gunakan e-mel MOE (DELIMa) sahaja.");
            signOut(auth);
            return;
        }

        window.userSemasa = user;
        if (txtLogin) txtLogin.innerText = "Log Keluar";
        if (iconLogin) iconLogin.className = "fas fa-sign-out-alt mr-2 text-red-500";
        
        // 2. Semak/Daftar Peranan Pengguna di Firestore
        const userRef = doc(db, "pengguna", user.email);
        const userSnap = await getDoc(userRef);
        
        let perananPengguna = "guru"; // Peranan lalai
        let kawasanPengguna = ""; // Kawasan lalai (kosong)
        
        if (!userSnap.exists()) {
            // Jika pengguna log masuk kali pertama
            await setDoc(userRef, {
                nama: user.displayName || "Pengguna DELIMa",
                email: user.email,
                peranan: "guru"
            });
        } else {
            // Jika sudah ada, ambil peranan mereka
            perananPengguna = userSnap.data().peranan || "guru";
            kawasanPengguna = userSnap.data().kawasan || "";
        }

        // Simpan dalam memori supaya bahagian lain (Upload/Padam) boleh baca
        window.userRole = perananPengguna;
        window.userKawalan = kawasanPengguna;

        // Dapatkan subjek semasa dari URL (contoh: ?subjek=bm)
        const urlParams = new URLSearchParams(window.location.search);
        const subjekSemasaHalaman = urlParams.get('subjek');

        // 3. Tentukan paparan UI berdasarkan peranan
        const adminMenuBtn = document.getElementById("admin-menu-button");

        if (perananPengguna === "admin") {
            window.isAdmin = true;
            if (typeof sahkanHalamanAdmin === "function") sahkanHalamanAdmin(); // Benarkan akses admin.html
            
            // Paparkan semua butang khusus admin (Upload, Padam)
            document.querySelectorAll('.hanya-admin').forEach(el => el.classList.remove('hidden'));
            
            // Paparkan butang menu admin khusus
            if (adminMenuBtn) adminMenuBtn.classList.remove("hidden");
            
        } else {
            window.isAdmin = false;
            
            // Tendang keluar jika cuba akses admin.html tapi bukan admin
            if (window.location.pathname.includes('admin.html')) {
                alert("Akses Ditolak. Halaman ini hanya untuk Pentadbir sistem.");
                window.location.href = "index.html";
            }
            
            // Logik KP & Penyelaras: Jika kawasan mereka sepadan dengan URL
            if (window.semakKebenaranAkses(subjekSemasaHalaman)) {
                // Buka butang muat naik/padam untuk halaman ini sahaja
                document.querySelectorAll('.hanya-admin').forEach(el => el.classList.remove('hidden'));
            } else {
                // Tutup butang jika bukan halaman mereka
                document.querySelectorAll('.hanya-admin').forEach(el => el.classList.add('hidden'));
            }

            // Sembunyikan menu admin untuk KP/Penyelaras/Guru
            if (adminMenuBtn) adminMenuBtn.classList.add("hidden");
        }

        // 4. Jalankan fungsi jadual & tracker
        if (typeof muatJadual === "function") muatJadual();
        
        if (document.getElementById('jadualTrackerBody') && typeof janaTrackerPanitia === "function") {
            const tahunSemasa = document.getElementById('filterTahun') ? document.getElementById('filterTahun').value : new Date().getFullYear().toString();
            janaTrackerPanitia(tahunSemasa);
        }

    } else {
        // 5. Logik apabila pengguna log keluar
        window.userSemasa = null;
        window.isAdmin = false;
        window.userRole = null;
        window.userKawalan = null;

        if (txtLogin) txtLogin.innerText = "Log Masuk (DELIMa)";
        if (iconLogin) iconLogin.className = "fas fa-sign-in-alt mr-2 text-slate-600";
        
        // Tendang keluar jika berada di halaman admin
        if (window.location.pathname.includes('admin.html')) {
            alert("Sila log masuk menggunakan e-mel DELIMa terlebih dahulu.");
            window.location.href = "index.html";
        }
        
        // Sembunyikan elemen admin
        document.querySelectorAll('.hanya-admin').forEach(el => el.classList.add('hidden'));
        const adminMenuBtn = document.getElementById("admin-menu-button");
        if (adminMenuBtn) adminMenuBtn.classList.add("hidden");
        
        // Tetap jalankan jadual untuk paparan awam (tanpa fungsi admin)
        if (typeof muatJadual === "function") muatJadual();
    }
});

// ==========================================
// LOGIK BUTANG KLIK LOG MASUK / KELUAR
// ==========================================
if (btnLogin) {
    btnLogin.addEventListener('click', () => {
        if (window.userSemasa) {
            signOut(auth).then(() => {
                alert("Anda telah log keluar.");
                window.location.reload(); // Muat semula halaman selepas log keluar
            }).catch((error) => console.error("Ralat log keluar:", error));
        } else {
            signInWithPopup(auth, provider).catch((error) => alert("Gagal log masuk: " + error.message));
        }
    });
}


// ==========================================
// 4. KAWALAN TAJUK MUKA SURAT BESAR
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
const subjekSemasa = (urlParams.get('subjek') || 'umum').toLowerCase();

const senaraiNamaPanitia = {
    // 1. PENGURUSAN UNIT KURIKULUM
    'surat_lantikan_kurikulum': 'Surat Lantikan Jawatankuasa Kurikulum Sekolah',
    'carta_kurikulum': 'Carta Organisasi Unit Kurikulum',
    'visi_misi_kpm': 'Visi dan Misi KPM',
    'visi_misi_sekolah': 'Visi dan Misi Sekolah',
    'dasar_kurikulum': 'Matlamat / Dasar / Ketetapan Kurikulum Sekolah',
    'buku_pengurusan': 'Buku Pengurusan Kurikulum',
    'takwim_persekolahan': 'Takwim Persekolahan',
    'takwim_kurikulum': 'Takwim Kurikulum',

    // 2. PEKELILING & MAKLUMAN
    'spi': 'Surat Pekeliling Ikhtisas (SPI) / Surat Siaran',
    'surat_makluman': 'Surat Makluman',

    // 3. DOKUMEN KURIKULUM
    'dskp': 'DSKP Semua Mata Pelajaran',
    'bahan_muat_turun': 'Bahan-bahan Dimuat Turun',
    'bahan_muat_naik': 'Bahan-bahan Dimuat Naik',

    // 4. PERANCANGAN KURIKULUM
    'perancangan_strategik': 'Perancangan Strategik Unit Kurikulum',
    'analisis_swot': 'Analisis SWOT',
    'pelan_taktikal': 'Pelan Taktikal Kurikulum',
    'pelan_operasi': 'Pelan Operasi Kurikulum',
    'oppm_pintas': 'Pengurus Projek Satu Muka Surat (OPPM) & PINTAS',

    // 5. MENGURUS MASA INSTRUKSIONAL
    'jk_jadual_waktu': 'Jawatankuasa Jadual Waktu',
    'jadual_waktu': 'Jadual Waktu Induk / Kelas',
    'jadual_guru_ganti': 'Jadual Guru Ganti',

    // 6. MESYUARAT INDUK KURIKULUM
    'mesyuarat_bil1': 'Surat Panggilan & Minit Mesyuarat Kurikulum Bil. 1',
    'mesyuarat_bil2': 'Surat Panggilan & Minit Mesyuarat Kurikulum Bil. 2',
    'mesyuarat_bil3': 'Surat Panggilan & Minit Mesyuarat Kurikulum Bil. 3',
    'mesyuarat_bil4': 'Surat Panggilan & Minit Mesyuarat Kurikulum Bil. 4',
    'maklum_balas_mesyuarat': 'Maklum Balas Minit Mesyuarat',

    // 7. PENGURUSAN PANITIA & PROGRAM
    'bm': 'Panitia Bahasa Melayu', 
    'bi': 'Panitia Bahasa Inggeris', 
    'mt': 'Panitia Matematik', 
    'sn': 'Panitia Sains', 
    'pi': 'Panitia Pendidikan Islam', 
    'pm': 'Panitia Pendidikan Moral',
    'sej': 'Panitia Sejarah', 
    'rbt': 'Panitia Reka Bentuk & Teknologi', 
    'psv': 'Panitia Pendidikan Seni Visual', 
    'mz': 'Panitia Pendidikan Muzik', 
    'pjpk': 'Panitia PJPK', 
    'ba': 'Panitia Bahasa Arab',
    'plc_panitia': 'PLC Panitia',
    'kertas_kerja_program': 'Kertas Kerja Program',
    'laporan_program': 'Dokumentasi / Laporan Program',

    // 8. PEMANTAUAN KURIKULUM
    'instrumen_pencerapan': 'Instrumen Pencerapan / Semakan',
    'jadual_pencerapan': 'Agihan Jadual Pencerapan / Semakan',
    'pencerapan_erph': 'Pencerapan e-RPH (Google Classroom)',
    'pencerapan_kendiri': 'Pencerapan PdPc Kendiri',
    'pencerapan_fasa1': 'Pencerapan PdPc Fasa 1',
    'pencerapan_fasa2': 'Pencerapan PdPc Fasa 2',
    'semakan_buku_latihan': 'Semakan Buku Latihan Murid',

    // 9. PENTAKSIRAN BILIK DARJAH (PBD)
    'jk_pbd': 'Jawatankuasa PBD',
    'takwim_pbd': 'Takwim PBD',
    'jadual_pbd': 'Jadual Pelaksanaan PBD',
    'instrumen_pbd': 'Instrumen PBD',
    'analisis_pbd': 'Analisis PBD',
    'intervensi_pbd': 'Program Intervensi PBD',
    'penjaminan_kualiti_pbd': 'Rekod Penjaminan Kualiti / Mutu',
    'pelaporan_pbd': 'Pelaporan PBD',

    // 10. UPSA / UASA
    'takwim_upsa': 'Takwim Pentaksiran UPSA / UASA',
    'jadual_upsa': 'Jadual UPSA / UASA',
    'jadual_gubal_soalan': 'Jadual Penggubalan Soalan',
    'analisis_upsa': 'Analisis Keputusan',
    'intervensi_upsa': 'Program Intervensi UPSA / UASA',

    // 11. BMI5-9T & SEGAK
    'jk_segak': 'Jawatankuasa BMI5-9T & SEGAK',
    'takwim_segak': 'Takwim Pelaksanaan BMI5-9T & SEGAK',
    'jadual_segak': 'Jadual Pelaksanaan BMI5-9T & SEGAK',

    // 12. KBAT
    'jk_kbat': 'Jawatankuasa KBAT',
    'instrumen_kbat': 'Instrumen KBAT',
    'pencerapan_kbat_kendiri': 'Pencerapan PdPc KBAT (Kendiri)',
    'pencerapan_kbat_pentadbir': 'Pencerapan PdPc KBAT (Pentadbir)',

    // 13. STANDARD KUALITI @ SEKOLAH
    'jk_standard_kualiti': 'Jawatankuasa Kurikulum / PPS',
    'panduan_standard_kualiti': 'Buku Panduan',
    'standard_kurikulum': 'Standard Kurikulum',
    'instrumen_standard_kualiti': 'Instrumen Kurikulum',

    // 14. PENDIGITALAN ICT
    'jk_ict': 'Jawatankuasa Pendigitalan ICT',

    // LAIN-LAIN (Fallback)
    'umum': 'One-Stop Centre'
};

const tajukPanitia = document.getElementById('tajukPanitia');
if (tajukPanitia) {
    tajukPanitia.textContent = senaraiNamaPanitia[subjekSemasa] || 'Senarai Dokumen';
    tajukPanitia.style.display = 'block';
    
    if(tajukPanitia.parentElement) {
        tajukPanitia.parentElement.style.display = 'block';
    }
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

// =========================================================================
// BAHAGIAN 6: PAPARAN JADUAL & FAIL (REAL-TIME LISTENER)
// =========================================================================
function muatJadual() {
    const adakahPanitia = ['bm', 'bi', 'mt', 'sn', 'pi', 'pm', 'sej', 'rbt', 'psv', 'mz', 'pjpk', 'ba'].includes(subjekSemasa);
    
    const ruangKhasPanitia = document.getElementById('ruangKhasPanitia');
    const ruangKhasBukanPanitia = document.getElementById('ruangKhasBukanPanitia');
    const ruangStatusMini = document.getElementById('ruangStatusMini');

    if (ruangKhasPanitia && ruangKhasBukanPanitia) {
        if (adakahPanitia) {
            ruangKhasPanitia.classList.remove('hidden');
            ruangKhasBukanPanitia.classList.add('hidden');
        } else {
            ruangKhasPanitia.classList.add('hidden');
            ruangKhasBukanPanitia.classList.remove('hidden');
        }
    }

    const ruangFail1 = document.getElementById('ruangFail1');
    const ruangJadual = document.getElementById('ruangJadual'); 

    let q;
    if (subjekSemasa && subjekSemasa !== "umum") {
        q = query(collection(db, "kandungan"), where("subjek", "==", subjekSemasa));
    } else {
        q = query(collection(db, "kandungan"));
    }

    if (unsubscribeJadual) unsubscribeJadual();

    unsubscribeJadual = onSnapshot(q, (snapshot) => {
        let senaraiData = [];
        
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data.status !== "aktif") return;

            if (tahunFilter && tahunFilter.toLowerCase() !== "semua") {
                const docTahun = data.tahun ? String(data.tahun).toLowerCase() : "";
                const filterKecil = String(tahunFilter).toLowerCase();
                if (docTahun !== "" && !docTahun.includes(filterKecil) && !filterKecil.includes(docTahun)) return; 
            }
            senaraiData.push({ id: docSnap.id, ...data });
        });

        senaraiData.sort((a, b) => {
            let tA = (a.tarikh && typeof a.tarikh.toMillis === 'function') ? a.tarikh.toMillis() : 0;
            let tB = (b.tarikh && typeof b.tarikh.toMillis === 'function') ? b.tarikh.toMillis() : 0;
            return tB - tA;
        });

        if (adakahPanitia && ruangFail1) {
            let htmlFail = { fail_1: "", fail_2: "", fail_3: "", fail_4: "" };
            let jumlahFail = { fail_1: 0, fail_2: 0, fail_3: 0, fail_4: 0 };

            senaraiData.forEach((data) => {
                let folderDocs = data.folder_destinasi;
                if (!['fail_1', 'fail_2', 'fail_3', 'fail_4'].includes(folderDocs)) folderDocs = 'fail_1'; 
                
                let rowHTML = `
                    <div class="flex justify-between items-center border-b border-slate-100 py-3 hover:bg-slate-50 transition-colors">
                        <div>
                            <p class="font-medium text-slate-800"><i class="fas fa-file-pdf text-red-500 mr-2"></i> ${data.tajuk}</p>
                            <p class="text-xs text-slate-500">Tahun: ${data.tahun || '-'} | Oleh: ${data.dimuat_naik_oleh}</p>
                        </div>
                        <div class="whitespace-nowrap ml-4 flex items-center">
                            <a href="${data.url_fail}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm font-bold mr-3">Buka</a>
                            <button onclick="padamRekod('${data.id}')" class="hanya-admin hidden text-red-600 hover:text-red-800 text-sm font-bold" title="Padam">Padam</button>
                        </div>
                    </div>
                `;
                htmlFail[folderDocs] += rowHTML;
                jumlahFail[folderDocs]++;
            });

            ['fail_1', 'fail_2', 'fail_3', 'fail_4'].forEach((f, index) => {
                const ruang = document.getElementById(`ruangFail${index + 1}`);
                if (ruang) {
                    ruang.innerHTML = jumlahFail[f] > 0 
                        ? htmlFail[f] 
                        : '<p class="text-slate-400 text-sm py-2 italic">Belum ada bahan.</p>';
                }
            });

            if (ruangStatusMini) {
                const formatBadge = (nama, jumlah) => jumlah > 0 
                    ? `<span class="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 text-sm font-bold shadow-sm"><i class="fas fa-check mr-1"></i>${nama}: ${jumlah}</span>`
                    : `<span class="bg-slate-50 text-slate-500 px-3 py-1.5 rounded-lg border border-slate-200 text-sm"><i class="fas fa-times mr-1"></i>${nama}: 0</span>`;
                
                ruangStatusMini.innerHTML = `
                    ${formatBadge('Fail 1', jumlahFail.fail_1)}
                    ${formatBadge('Fail 2', jumlahFail.fail_2)}
                    ${formatBadge('Fail 3', jumlahFail.fail_3)}
                    ${formatBadge('Fail 4', jumlahFail.fail_4)}
                `;
            }
        } 
        else if (!adakahPanitia && ruangJadual) {
            if (senaraiData.length === 0) {
                ruangJadual.innerHTML = '<p class="text-center text-slate-400 py-10"><i class="fas fa-folder-open text-4xl mb-3 block"></i> Belum ada bahan dimuat naik.</p>';
                
                if (ruangStatusMini) {
                    ruangStatusMini.innerHTML = `<span class="bg-slate-50 text-slate-500 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium"><i class="fas fa-times-circle mr-2"></i>Belum Ada Fail</span>`;
                }
            } else {
                let htmlJadual = `
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-100 text-slate-600 text-sm border-b border-slate-200">
                                <th class="p-4 font-medium rounded-tl-lg">Tajuk Dokumen</th>
                                <th class="p-4 font-medium hidden md:table-cell">Tahun</th>
                                <th class="p-4 font-medium hidden md:table-cell">Oleh</th>
                                <th class="p-4 font-medium">Tarikh</th>
                                <th class="p-4 font-medium text-right rounded-tr-lg">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody class="text-sm">`;

                senaraiData.forEach((data) => {
                    let tarikhMasa = (data.tarikh && typeof data.tarikh.toDate === 'function') 
                        ? data.tarikh.toDate().toLocaleDateString('ms-MY') 
                        : "Baru sahaja";
                        
                    htmlJadual += `
                        <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
                            <td class="p-4 font-medium text-slate-800"><i class="fas fa-file-alt text-blue-500 mr-2 text-lg"></i> ${data.tajuk}</td>
                            <td class="p-4 text-slate-500 hidden md:table-cell"><span class="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">${data.tahun || 'Tiada'}</span></td>
                            <td class="p-4 text-slate-500 hidden md:table-cell">${data.dimuat_naik_oleh}</td>
                            <td class="p-4 text-slate-500">${tarikhMasa}</td>
                            <td class="p-4 text-right whitespace-nowrap">
                                <a href="${data.url_fail}" target="_blank" class="inline-block bg-blue-100 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-200 transition text-xs font-bold mr-2">Buka</a>
                                <button onclick="padamRekod('${data.id}')" class="hanya-admin hidden bg-red-100 text-red-700 px-3 py-2 rounded-md hover:bg-red-200 transition text-xs font-bold" title="Padam"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>`;
                });
                htmlJadual += `</tbody></table></div>`;
                ruangJadual.innerHTML = htmlJadual;

                if (ruangStatusMini) {
                    ruangStatusMini.innerHTML = `<span class="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg border border-emerald-200 text-sm font-bold shadow-sm"><i class="fas fa-check-circle mr-2"></i>Telah Dimuat Naik: ${senaraiData.length} Fail</span>`;
                }
            }
        }

        // Tunjukkan semula elemen admin jika pengguna semasa ialah admin
        if (window.isAdmin) {
            document.querySelectorAll('.hanya-admin').forEach(el => el.classList.remove('hidden'));
        }
    });
}

// ==========================================
// 7. LOGIK MUAT NAIK FAIL (MODAL & GAS)
// ==========================================
const modalUpload = document.getElementById('modalUpload');
const btnTutupModal = document.getElementById('btnTutupModal');
const formUpload = document.getElementById('formUpload');
const btnSubmitUpload = document.getElementById('btnSubmitUpload');
const txtSubmit = document.getElementById('txtSubmit');
let folderSasaranSemasa = "fail_1"; 

document.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn && btn.id === 'btnSubmitUpload') return; 

    if (btn && (btn.textContent.includes('Muat Naik') || btn.classList.contains('btn-muat-naik') || btn.id === 'btnInjectUploadUtama')) {
        if (!window.userSemasa) return alert("Sila Log Masuk (DELIMa) terlebih dahulu.");
        const urlParams = new URLSearchParams(window.location.search);
const subjekSemasaBorang = urlParams.get('subjek');

if (!window.semakKebenaranAkses(subjekSemasaBorang)) {
    return alert("Akses ditolak: Anda hanya dibenarkan memuat naik fail di bahagian seliaan anda sahaja.");
}
        
        let folderBidik = btn.getAttribute('data-folder');
        
        if (!folderBidik) {
            const kotakInduk = btn.closest('[id*="ail1"], [id*="ail2"], [id*="ail3"], [id*="ail4"]');
            if (kotakInduk) {
                if (kotakInduk.id.includes('2')) folderBidik = "fail_2";
                else if (kotakInduk.id.includes('3')) folderBidik = "fail_3";
                else if (kotakInduk.id.includes('4')) folderBidik = "fail_4";
                else folderBidik = "fail_1";
            } else {
                folderBidik = "fail_1"; 
            }
        }
        
        folderSasaranSemasa = folderBidik; 
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
        const tahunDipilih = document.getElementById('inputTahun').value;
        const user = auth.currentUser;

        if (!file || !user) return;
        if (file.size > (15 * 1024 * 1024)) return alert("Saiz fail melebihi 15MB.");

        try {
            btnSubmitUpload.disabled = true;
            txtSubmit.innerHTML = 'Memproses...';

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async function() {
                const base64Data = reader.result.split(',')[1]; 
                const gasUrl = "https://script.google.com/macros/s/AKfycbyAeUulIKI140BefI4ovGqmzrifbPKJ5USstIoCZ-mV_OzH4PfR8d3cjxfJGy572zYxbg/exec";


const namaFolderGabungan = folderSasaranSemasa.replace('_', ' ').toUpperCase() + " " + subjekSemasa.toUpperCase();
              
                const responsGAS = await fetch(gasUrl, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({ 
                    filename: file.name, 
                    mimeType: file.type, 
                    base64: base64Data,
                    namaFolder: namaFolderGabungan 
})
                });
                const hasilGAS = await responsGAS.json();

                if (hasilGAS.status === 'success' || hasilGAS.url) {
                    await addDoc(collection(db, "kandungan"), {
                        tajuk: tajuk, 
                        kategori: folderSasaranSemasa, 
                        subjek: subjekSemasa, 
                        folder_destinasi: folderSasaranSemasa, 
                        url_fail: hasilGAS.url,
                        dimuat_naik_oleh: user.displayName, 
                        tarikh: serverTimestamp(),
                        tahun: tahunDipilih,
                        status: "aktif"
                    });
                    
                    alert(`Berjaya dimuat naik ke ${folderSasaranSemasa.replace('_', ' ').toUpperCase()}!`);
                    modalUpload.classList.add('hidden');
                    formUpload.reset();
                } else {
                    alert("Gagal memuat naik fail ke Google Drive.");
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
            if(keyword.length < 3) return alert("Sila taip minimum 3 huruf.");
            
            modalCarian.classList.remove('hidden');
            ruangHasilCarian.innerHTML = '<p class="text-center text-slate-500 py-10"><i class="fas fa-spinner fa-spin text-3xl mb-3 block"></i>Sedang menapis dokumen...</p>';
            
            try {
                const qSearch = query(collection(db, "kandungan"), where("status", "==", "aktif"));
                const querySnapshot = await getDocs(qSearch);
                
                let hasilHTML = `<table class="w-full text-left border-collapse"><tbody>`;
                let jumlahJumpa = 0;

                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    if(data.tajuk.toLowerCase().includes(keyword)) {
                        jumlahJumpa++;
                        hasilHTML += `
                            <tr class="border-b hover:bg-slate-50">
                                <td class="p-3">
                                    <p class="font-bold text-slate-800 text-base">${data.tajuk}</p>
                                    <p class="text-xs text-slate-500 mt-1">
                                        <span class="bg-slate-200 px-2 py-0.5 rounded mr-2">Folder: ${senaraiNamaPanitia[data.subjek] || data.subjek}</span> Tahun: ${data.tahun || 'Tiada'}
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

    if (btnTutupCarian) btnTutupCarian.addEventListener('click', () => modalCarian.classList.add('hidden'));
}

// ==========================================
// 9. LOGIK ADMIN CONSOLE (ARKIB & PADAM)
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
    const qArkib = query(collection(db, "kandungan"), where("status", "==", "dipadam"));
    
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

        let arkibData = [];
        snapshot.forEach(docSnap => arkibData.push({id: docSnap.id, ...docSnap.data()}));
        arkibData.sort((a,b) => (b.tarikh?.toMillis()||0) - (a.tarikh?.toMillis()||0));

        arkibData.forEach((data) => {
            htmlArkib += `
                <tr class="border-b border-slate-100 hover:bg-slate-50">
                    <td class="p-4">
                        <p class="font-bold text-slate-800">${data.tajuk}</p>
                        <p class="text-xs text-slate-500">Folder Asal: ${senaraiNamaPanitia[data.subjek] || data.subjek} | Tahun: ${data.tahun}</p>
                    </td>
                    <td class="p-4 text-slate-500 hidden md:table-cell">${data.dimuat_naik_oleh}</td>
                    <td class="p-4 text-right whitespace-nowrap">
                        <button onclick="kembalikanFail('${data.id}')" class="bg-emerald-100 text-emerald-700 px-3 py-2 rounded-md hover:bg-emerald-200 transition text-xs font-bold mr-2"><i class="fas fa-undo mr-1"></i>Pulihkan</button>
                        <button onclick="padamKekalFail('${data.id}')" class="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition text-xs font-bold"><i class="fas fa-trash mr-1"></i>Padam Kekal</button>
                    </td>
                </tr>
            `;
        });
        htmlArkib += `</tbody></table></div>`;
        ruangArkib.innerHTML = htmlArkib;
    });
}

window.padamRekod = async function(id) {
    if (confirm("Adakah anda pasti mahu memadam fail ini? Ia akan dipindahkan ke Arkib.")) {
        await updateDoc(doc(db, "kandungan", id), { status: "dipadam" });
    }
}

window.kembalikanFail = async function(id) {
    if (confirm("Adakah anda pasti mahu memulihkan fail ini?")) await updateDoc(doc(db, "kandungan", id), { status: "aktif" });
}

window.padamKekalFail = async function(id) {
    if (confirm("AMARAN: Fail akan dipadam sepenuhnya. Teruskan?")) await deleteDoc(doc(db, "kandungan", id));
}

// =========================================================================
// JANA TRACKER PEMANTAUAN (14 KOTAK MENGIKUT NAVBAR)
// =========================================================================
function janaTrackerPanitia(tahunPilih = "semua") {
    // 1. Senarai Panitia - 12 Subjek berdasarkan menu navbar
    const senaraiSemuaPanitia = [
        { id: "bm", nama: "B. Melayu" }, { id: "bi", nama: "B. Inggeris" },
        { id: "mt", nama: "Matematik" }, { id: "sn", nama: "Sains" },
        { id: "pi", nama: "Pend. Islam" }, { id: "pm", nama: "Pend. Moral" },
        { id: "sej", nama: "Sejarah" }, { id: "rbt", nama: "RBT" },
        { id: "psv", nama: "Pend. Seni Visual" }, { id: "mz", nama: "Pend. Muzik" },
        { id: "pjpk", nama: "PJPK" }, { id: "ba", nama: "B. Arab" }
    ];

    let dataPanitia = {};
    senaraiSemuaPanitia.forEach(p => {
        dataPanitia[p.id] = { fail1: 0, fail2: 0, fail3: 0, fail4: 0, status: "Belum Lengkap" };
    });

    // 2. Senarai Bukan Panitia
    let dataBukanPanitia = {
        'surat_lantikan_kurikulum': 0, 'carta_kurikulum': 0, 'visi_misi_kpm': 0, 'visi_misi_sekolah': 0, 'dasar_kurikulum': 0, 'buku_pengurusan': 0, 'takwim_persekolahan': 0, 'takwim_kurikulum': 0,
        'spi': 0, 'surat_makluman': 0,
        'dskp': 0, 'bahan_muat_turun': 0, 'bahan_muat_naik': 0,
        'perancangan_strategik': 0, 'analisis_swot': 0, 'pelan_taktikal': 0, 'pelan_operasi': 0, 'oppm_pintas': 0,
        'jk_jadual_waktu': 0, 'jadual_waktu': 0, 'jadual_guru_ganti': 0,
        'mesyuarat_bil1': 0, 'mesyuarat_bil2': 0, 'mesyuarat_bil3': 0, 'mesyuarat_bil4': 0, 'maklum_balas_mesyuarat': 0,
        'plc_panitia': 0, 'kertas_kerja_program': 0, 'laporan_program': 0,
        'instrumen_pencerapan': 0, 'jadual_pencerapan': 0, 'pencerapan_erph': 0, 'pencerapan_kendiri': 0, 'pencerapan_fasa1': 0, 'pencerapan_fasa2': 0, 'semakan_buku_latihan': 0,
        'jk_pbd': 0, 'takwim_pbd': 0, 'jadual_pbd': 0, 'instrumen_pbd': 0, 'analisis_pbd': 0, 'intervensi_pbd': 0, 'penjaminan_kualiti_pbd': 0, 'pelaporan_pbd': 0,
        'takwim_upsa': 0, 'jadual_upsa': 0, 'jadual_gubal_soalan': 0, 'analisis_upsa': 0, 'intervensi_upsa': 0,
        'jk_segak': 0, 'takwim_segak': 0, 'jadual_segak': 0,
        'jk_kbat': 0, 'instrumen_kbat': 0, 'pencerapan_kbat_kendiri': 0, 'pencerapan_kbat_pentadbir': 0,
        'jk_standard_kualiti': 0, 'panduan_standard_kualiti': 0, 'standard_kurikulum': 0, 'instrumen_standard_kualiti': 0,
        'jk_ict': 0
    };

    const qTracker = query(collection(db, "kandungan")); 

    onSnapshot(qTracker, (snapshot) => {
        // Reset 
        senaraiSemuaPanitia.forEach(p => {
            dataPanitia[p.id] = { fail1: 0, fail2: 0, fail3: 0, fail4: 0, status: "Belum Lengkap" };
        });
        Object.keys(dataBukanPanitia).forEach(k => dataBukanPanitia[k] = 0);

        snapshot.forEach((doc) => {
            const data = doc.data();
            const sj = data.subjek;
            const docTahun = data.tahun;
            
            if (tahunPilih !== "semua" && docTahun !== tahunPilih) return; 

            // Kira Panitia
            if (dataPanitia[sj] !== undefined) {
                if (data.folder === "Fail 1") dataPanitia[sj].fail1++;
                else if (data.folder === "Fail 2") dataPanitia[sj].fail2++;
                else if (data.folder === "Fail 3") dataPanitia[sj].fail3++;
                else if (data.folder === "Fail 4") dataPanitia[sj].fail4++;
            } 
            // Kira Bukan Panitia
            else if (dataBukanPanitia[sj] !== undefined) {
                dataBukanPanitia[sj]++;
            }
        });

        // ================== RENDER JADUAL PANITIA ==================
        const jadualBody = document.getElementById('jadualTrackerBody');
        if (jadualBody) {
            jadualBody.innerHTML = "";
            let htmlPanitia = "";
            senaraiSemuaPanitia.forEach(p => {
                let d = dataPanitia[p.id];
                if (d.fail1 >= 1 && d.fail2 >= 1 && d.fail3 >= 1) {
                    d.status = "Lengkap";
                }
                
                let badgetStatus = d.status === "Lengkap" 
                    ? `<span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">Lengkap</span>`
                    : `<span class="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs border border-amber-200">Belum Lengkap</span>`;
                
                htmlPanitia += `
                <tr class="border-b border-slate-100 hover:bg-blue-50 transition text-xs">
                    <td class="py-3 px-4 font-semibold text-slate-700">${p.nama}</td>
                    <td class="py-3 px-4 text-center">${d.fail1 > 0 ? `<span class="text-green-600 font-bold">✔ (${d.fail1})</span>` : `<span class="text-slate-300">✖ (0)</span>`}</td>
                    <td class="py-3 px-4 text-center">${d.fail2 > 0 ? `<span class="text-green-600 font-bold">✔ (${d.fail2})</span>` : `<span class="text-slate-300">✖ (0)</span>`}</td>
                    <td class="py-3 px-4 text-center">${d.fail3 > 0 ? `<span class="text-green-600 font-bold">✔ (${d.fail3})</span>` : `<span class="text-slate-300">✖ (0)</span>`}</td>
                    <td class="py-3 px-4 text-center">${d.fail4 > 0 ? `<span class="text-green-600 font-bold">✔ (${d.fail4})</span>` : `<span class="text-slate-300">✖ (0)</span>`}</td>
                    <td class="py-3 px-4 text-center">${badgetStatus}</td>
                </tr>`;
            });
            jadualBody.innerHTML = htmlPanitia;
        }

        // ================== RENDER BUKAN PANITIA ==================
        function renderBukanPanitia(kumpulan, elementId) {
            const container = document.getElementById(elementId);
            if (!container) return;
            
            let htmlList = `<div class="space-y-1">`;
            kumpulan.forEach(item => {
                let count = dataBukanPanitia[item.id];
                let lencana = count > 0 
                    ? `<span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200">Ada (${count})</span>`
                    : `<span class="bg-slate-100 text-slate-400 px-2 py-0.5 rounded text-[10px] border border-slate-200">Tiada (0)</span>`;
                
                htmlList += `
                <div class="flex justify-between items-center bg-white p-2 border border-transparent border-b-slate-100 last:border-b-transparent hover:bg-slate-50 transition rounded-md">
                    <span class="text-[11px] text-slate-600 font-medium">${item.nama}</span>
                    ${lencana}
                </div>`;
            });
            htmlList += `</div>`;
            container.innerHTML = htmlList;
        }

        // Papar ikut 14 Kotak
        renderBukanPanitia([
            { id: 'surat_lantikan_kurikulum', nama: 'Surat Lantikan JK' }, { id: 'carta_kurikulum', nama: 'Carta Organisasi Unit' },
            { id: 'visi_misi_kpm', nama: 'Visi & Misi KPM' }, { id: 'visi_misi_sekolah', nama: 'Visi & Misi Sekolah' },
            { id: 'dasar_kurikulum', nama: 'Matlamat/Dasar/Ketetapan' }, { id: 'buku_pengurusan', nama: 'Buku Pengurusan' },
            { id: 'takwim_persekolahan', nama: 'Takwim Persekolahan' }, { id: 'takwim_kurikulum', nama: 'Takwim Kurikulum' }
        ], 'boxPengurusanUnit');

        renderBukanPanitia([
            { id: 'spi', nama: 'SPI' }, { id: 'surat_makluman', nama: 'Surat Makluman' }
        ], 'boxPekeliling');

        renderBukanPanitia([
            { id: 'dskp', nama: 'DSKP Semua MP' }, { id: 'bahan_muat_turun', nama: 'Bahan Dimuat Turun' }, { id: 'bahan_muat_naik', nama: 'Bahan Dimuat Naik' }
        ], 'boxDokumen');

        renderBukanPanitia([
            { id: 'perancangan_strategik', nama: 'Perancangan Strategik' }, { id: 'analisis_swot', nama: 'Analisis SWOT' },
            { id: 'pelan_taktikal', nama: 'Pelan Taktikal' }, { id: 'pelan_operasi', nama: 'Pelan Operasi' }, { id: 'oppm_pintas', nama: 'OPPM & PINTAS' }
        ], 'boxPerancangan');

        renderBukanPanitia([
            { id: 'jk_jadual_waktu', nama: 'JK Jadual Waktu' }, { id: 'jadual_waktu', nama: 'Jadual Waktu Induk/Kelas' }, { id: 'jadual_guru_ganti', nama: 'Jadual Guru Ganti' }
        ], 'boxMasa');

        renderBukanPanitia([
            { id: 'mesyuarat_bil1', nama: 'Minit Mesyuarat Bil. 1' }, { id: 'mesyuarat_bil2', nama: 'Minit Mesyuarat Bil. 2' },
            { id: 'mesyuarat_bil3', nama: 'Minit Mesyuarat Bil. 3' }, { id: 'mesyuarat_bil4', nama: 'Minit Mesyuarat Bil. 4' }, { id: 'maklum_balas_mesyuarat', nama: 'Maklum Balas Minit' }
        ], 'boxMesyuarat');

        renderBukanPanitia([
            { id: 'plc_panitia', nama: 'PLC Panitia' }, { id: 'kertas_kerja_program', nama: 'Kertas Kerja Program' }, { id: 'laporan_program', nama: 'Dokumentasi / Laporan' }
        ], 'boxPanitiaProgram');

        renderBukanPanitia([
            { id: 'instrumen_pencerapan', nama: 'Instrumen Pencerapan' }, { id: 'jadual_pencerapan', nama: 'Agihan Jadual' },
            { id: 'pencerapan_erph', nama: 'Pencerapan e-RPH' }, { id: 'pencerapan_kendiri', nama: 'PdPc Kendiri' },
            { id: 'pencerapan_fasa1', nama: 'PdPc Fasa 1' }, { id: 'pencerapan_fasa2', nama: 'PdPc Fasa 2' }, { id: 'semakan_buku_latihan', nama: 'Semakan Buku Latihan' }
        ], 'boxPemantauan');

        renderBukanPanitia([
            { id: 'jk_pbd', nama: 'Jawatankuasa PBD' }, { id: 'takwim_pbd', nama: 'Takwim PBD' }, { id: 'jadual_pbd', nama: 'Jadual Pelaksanaan' },
            { id: 'instrumen_pbd', nama: 'Instrumen PBD' }, { id: 'analisis_pbd', nama: 'Analisis PBD' }, { id: 'intervensi_pbd', nama: 'Program Intervensi' },
            { id: 'penjaminan_kualiti_pbd', nama: 'Penjaminan Kualiti' }, { id: 'pelaporan_pbd', nama: 'Pelaporan PBD' }
        ], 'boxPbd');

        renderBukanPanitia([
            { id: 'takwim_upsa', nama: 'Takwim Pentaksiran' }, { id: 'jadual_upsa', nama: 'Jadual UPSA / UASA' }, { id: 'jadual_gubal_soalan', nama: 'Jadual Gubal Soalan' },
            { id: 'analisis_upsa', nama: 'Analisis Keputusan' }, { id: 'intervensi_upsa', nama: 'Program Intervensi' }
        ], 'boxUpsa');

        renderBukanPanitia([
            { id: 'jk_segak', nama: 'Jawatankuasa' }, { id: 'takwim_segak', nama: 'Takwim Pelaksanaan' }, { id: 'jadual_segak', nama: 'Jadual Pelaksanaan' }
        ], 'boxSegak');

        renderBukanPanitia([
            { id: 'jk_kbat', nama: 'Jawatankuasa KBAT' }, { id: 'instrumen_kbat', nama: 'Instrumen KBAT' },
            { id: 'pencerapan_kbat_kendiri', nama: 'PdPc KBAT (Kendiri)' }, { id: 'pencerapan_kbat_pentadbir', nama: 'PdPc (Pentadbir)' }
        ], 'boxKbat');

        renderBukanPanitia([
            { id: 'jk_standard_kualiti', nama: 'Jawatankuasa / PPS' }, { id: 'panduan_standard_kualiti', nama: 'Buku Panduan' },
            { id: 'standard_kurikulum', nama: 'Standard Kurikulum' }, { id: 'instrumen_standard_kualiti', nama: 'Instrumen Kurikulum' }
        ], 'boxStandard');

        renderBukanPanitia([
            { id: 'jk_ict', nama: 'Jawatankuasa ICT' }
        ], 'boxIct');

    });
}
window.janaTrackerPanitia = janaTrackerPanitia;

// =========================================================================
// 11. PENGURUSAN AKSES PENGGUNA (ADMIN PANEL)
// =========================================================================

async function muatSenaraiPengguna() {
    console.log("Fungsi muatSenaraiPengguna mula berjalan..."); 
    
    const tbody = document.getElementById("senarai-pengguna-body");
    if (!tbody) {
        console.error("Ralat: ID 'senarai-pengguna-body' tidak dijumpai di dalam HTML!");
        return; 
    }

    try {
        const querySnapshot = await getDocs(collection(db, "pengguna"));
        console.log("Berjaya menarik data pengguna dari Firebase.");
        tbody.innerHTML = ""; 

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const email = docSnap.id;
            const emailSafe = email.replace(/[@.]/g, ''); 

            const userKawasan = Array.isArray(data.kawasan) ? data.kawasan : [];
            const hideKawasan = (data.peranan === 'akses_khas') ? '' : 'hidden';

            const tr = document.createElement("tr");
            tr.className = "hover:bg-slate-50 border-b border-slate-100 transition-colors";
            tr.innerHTML = `
                <td class="p-4">
                    <div class="font-bold text-slate-800">${data.nama}</div>
                    <div class="text-sm text-slate-500">${data.email}</div>
                </td>
                <td class="p-4">
                    <select id="role-${emailSafe}" onchange="tukarPaparanKawasan('${emailSafe}')" class="border border-slate-300 rounded-lg p-2 w-full text-sm outline-none mb-2">
                        <option value="guru" ${data.peranan === 'guru' ? 'selected' : ''}>Guru Biasa</option>
                        <option value="akses_khas" ${data.peranan === 'akses_khas' ? 'selected' : ''}>Akses Khas (Panitia / Penyelaras)</option>
                        <option value="admin" ${data.peranan === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                    
                    <div id="div-kawasan-${emailSafe}" class="${hideKawasan}">
                        <select id="kawasan-${emailSafe}" multiple class="border border-slate-300 rounded-lg p-2 w-full text-sm outline-none h-60 custom-scrollbar">
                            <optgroup label="1. Pengurusan Unit">
                                <option value="surat_lantikan_kurikulum" ${userKawasan.includes('surat_lantikan_kurikulum') ? 'selected' : ''}>Surat Lantikan JK</option>
                                <option value="carta_kurikulum" ${userKawasan.includes('carta_kurikulum') ? 'selected' : ''}>Carta Organisasi</option>
                                <option value="visi_misi_kpm" ${userKawasan.includes('visi_misi_kpm') ? 'selected' : ''}>Visi & Misi KPM</option>
                                <option value="visi_misi_sekolah" ${userKawasan.includes('visi_misi_sekolah') ? 'selected' : ''}>Visi & Misi Sekolah</option>
                                <option value="dasar_kurikulum" ${userKawasan.includes('dasar_kurikulum') ? 'selected' : ''}>Dasar Kurikulum</option>
                                <option value="buku_pengurusan" ${userKawasan.includes('buku_pengurusan') ? 'selected' : ''}>Buku Pengurusan</option>
                                <option value="takwim_persekolahan" ${userKawasan.includes('takwim_persekolahan') ? 'selected' : ''}>Takwim Persekolahan</option>
                                <option value="takwim_kurikulum" ${userKawasan.includes('takwim_kurikulum') ? 'selected' : ''}>Takwim Kurikulum</option>
                            </optgroup>
                            
                            <optgroup label="2. Pekeliling & Makluman">
                                <option value="spi" ${userKawasan.includes('spi') ? 'selected' : ''}>Pekeliling (SPI)</option>
                                <option value="surat_makluman" ${userKawasan.includes('surat_makluman') ? 'selected' : ''}>Surat Makluman</option>
                            </optgroup>

                            <optgroup label="3. Dokumen Kurikulum">
                                <option value="dskp" ${userKawasan.includes('dskp') ? 'selected' : ''}>DSKP</option>
                                <option value="bahan_muat_turun" ${userKawasan.includes('bahan_muat_turun') ? 'selected' : ''}>Bahan Muat Turun</option>
                                <option value="bahan_muat_naik" ${userKawasan.includes('bahan_muat_naik') ? 'selected' : ''}>Bahan Muat Naik</option>
                            </optgroup>

                            <optgroup label="4. Perancangan Kurikulum">
                                <option value="perancangan_strategik" ${userKawasan.includes('perancangan_strategik') ? 'selected' : ''}>Perancangan Strategik</option>
                                <option value="analisis_swot" ${userKawasan.includes('analisis_swot') ? 'selected' : ''}>Analisis SWOT</option>
                                <option value="pelan_taktikal" ${userKawasan.includes('pelan_taktikal') ? 'selected' : ''}>Pelan Taktikal</option>
                                <option value="pelan_operasi" ${userKawasan.includes('pelan_operasi') ? 'selected' : ''}>Pelan Operasi</option>
                                <option value="oppm_pintas" ${userKawasan.includes('oppm_pintas') ? 'selected' : ''}>OPPM & PINTAS</option>
                            </optgroup>

                            <optgroup label="5. Masa Instruksional">
                                <option value="jk_jadual_waktu" ${userKawasan.includes('jk_jadual_waktu') ? 'selected' : ''}>JK Jadual Waktu</option>
                                <option value="jadual_waktu" ${userKawasan.includes('jadual_waktu') ? 'selected' : ''}>Jadual Waktu</option>
                                <option value="jadual_guru_ganti" ${userKawasan.includes('jadual_guru_ganti') ? 'selected' : ''}>Jadual Guru Ganti</option>
                            </optgroup>

                            <optgroup label="6. Mesyuarat Induk">
                                <option value="mesyuarat_bil1" ${userKawasan.includes('mesyuarat_bil1') ? 'selected' : ''}>Mesyuarat Bil 1</option>
                                <option value="mesyuarat_bil2" ${userKawasan.includes('mesyuarat_bil2') ? 'selected' : ''}>Mesyuarat Bil 2</option>
                                <option value="mesyuarat_bil3" ${userKawasan.includes('mesyuarat_bil3') ? 'selected' : ''}>Mesyuarat Bil 3</option>
                                <option value="mesyuarat_bil4" ${userKawasan.includes('mesyuarat_bil4') ? 'selected' : ''}>Mesyuarat Bil 4</option>
                                <option value="maklum_balas_mesyuarat" ${userKawasan.includes('maklum_balas_mesyuarat') ? 'selected' : ''}>Maklum Balas Minit</option>
                            </optgroup>

                            <optgroup label="7. Panitia Subjek">
                                <option value="bm" ${userKawasan.includes('bm') ? 'selected' : ''}>Bahasa Melayu</option>
                                <option value="bi" ${userKawasan.includes('bi') ? 'selected' : ''}>Bahasa Inggeris</option>
                                <option value="mt" ${userKawasan.includes('mt') ? 'selected' : ''}>Matematik</option>
                                <option value="sn" ${userKawasan.includes('sn') ? 'selected' : ''}>Sains</option>
                                <option value="pi" ${userKawasan.includes('pi') ? 'selected' : ''}>Pendidikan Islam</option>
                                <option value="ba" ${userKawasan.includes('ba') ? 'selected' : ''}>Bahasa Arab</option>
                                <option value="sej" ${userKawasan.includes('sej') ? 'selected' : ''}>Sejarah</option>
                                <option value="rbt" ${userKawasan.includes('rbt') ? 'selected' : ''}>RBT</option>
                                <option value="psv" ${userKawasan.includes('psv') ? 'selected' : ''}>PSV</option>
                                <option value="pjpk" ${userKawasan.includes('pjpk') ? 'selected' : ''}>PJPK</option>
                                <option value="mz" ${userKawasan.includes('mz') ? 'selected' : ''}>Pend. Muzik</option>
                                <option value="pm" ${userKawasan.includes('pm') ? 'selected' : ''}>Pend. Moral</option>
                            </optgroup>

                            <optgroup label="7b. Program Panitia">
                                <option value="plc_panitia" ${userKawasan.includes('plc_panitia') ? 'selected' : ''}>PLC Panitia</option>
                                <option value="kertas_kerja_program" ${userKawasan.includes('kertas_kerja_program') ? 'selected' : ''}>Kertas Kerja Program</option>
                                <option value="laporan_program" ${userKawasan.includes('laporan_program') ? 'selected' : ''}>Laporan Program</option>
                            </optgroup>

                            <optgroup label="8. Pemantauan Kurikulum">
                                <option value="instrumen_pencerapan" ${userKawasan.includes('instrumen_pencerapan') ? 'selected' : ''}>Instrumen Pencerapan</option>
                                <option value="jadual_pencerapan" ${userKawasan.includes('jadual_pencerapan') ? 'selected' : ''}>Jadual Pencerapan</option>
                                <option value="pencerapan_erph" ${userKawasan.includes('pencerapan_erph') ? 'selected' : ''}>Pencerapan eRPH</option>
                                <option value="pencerapan_kendiri" ${userKawasan.includes('pencerapan_kendiri') ? 'selected' : ''}>PdPc Kendiri</option>
                                <option value="pencerapan_fasa1" ${userKawasan.includes('pencerapan_fasa1') ? 'selected' : ''}>PdPc Fasa 1</option>
                                <option value="pencerapan_fasa2" ${userKawasan.includes('pencerapan_fasa2') ? 'selected' : ''}>PdPc Fasa 2</option>
                                <option value="semakan_buku_latihan" ${userKawasan.includes('semakan_buku_latihan') ? 'selected' : ''}>Semakan Buku Latihan</option>
                            </optgroup>

                            <optgroup label="9. PBD">
                                <option value="jk_pbd" ${userKawasan.includes('jk_pbd') ? 'selected' : ''}>JK PBD</option>
                                <option value="takwim_pbd" ${userKawasan.includes('takwim_pbd') ? 'selected' : ''}>Takwim PBD</option>
                                <option value="jadual_pbd" ${userKawasan.includes('jadual_pbd') ? 'selected' : ''}>Jadual PBD</option>
                                <option value="instrumen_pbd" ${userKawasan.includes('instrumen_pbd') ? 'selected' : ''}>Instrumen PBD</option>
                                <option value="analisis_pbd" ${userKawasan.includes('analisis_pbd') ? 'selected' : ''}>Analisis PBD</option>
                                <option value="intervensi_pbd" ${userKawasan.includes('intervensi_pbd') ? 'selected' : ''}>Intervensi PBD</option>
                                <option value="penjaminan_kualiti_pbd" ${userKawasan.includes('penjaminan_kualiti_pbd') ? 'selected' : ''}>Penjaminan Kualiti PBD</option>
                                <option value="pelaporan_pbd" ${userKawasan.includes('pelaporan_pbd') ? 'selected' : ''}>Pelaporan PBD</option>
                            </optgroup>

                            <optgroup label="10. UPSA/UASA">
                                <option value="takwim_upsa" ${userKawasan.includes('takwim_upsa') ? 'selected' : ''}>Takwim UPSA</option>
                                <option value="jadual_upsa" ${userKawasan.includes('jadual_upsa') ? 'selected' : ''}>Jadual UPSA</option>
                                <option value="jadual_gubal_soalan" ${userKawasan.includes('jadual_gubal_soalan') ? 'selected' : ''}>Jadual Gubal Soalan</option>
                                <option value="analisis_upsa" ${userKawasan.includes('analisis_upsa') ? 'selected' : ''}>Analisis UPSA</option>
                                <option value="intervensi_upsa" ${userKawasan.includes('intervensi_upsa') ? 'selected' : ''}>Intervensi UPSA</option>
                            </optgroup>

                            <optgroup label="11. BMI5-9T & SEGAK">
                                <option value="jk_segak" ${userKawasan.includes('jk_segak') ? 'selected' : ''}>JK SEGAK</option>
                                <option value="takwim_segak" ${userKawasan.includes('takwim_segak') ? 'selected' : ''}>Takwim SEGAK</option>
                                <option value="jadual_segak" ${userKawasan.includes('jadual_segak') ? 'selected' : ''}>Jadual SEGAK</option>
                            </optgroup>

                            <optgroup label="12. KBAT">
                                <option value="jk_kbat" ${userKawasan.includes('jk_kbat') ? 'selected' : ''}>JK KBAT</option>
                                <option value="instrumen_kbat" ${userKawasan.includes('instrumen_kbat') ? 'selected' : ''}>Instrumen KBAT</option>
                                <option value="pencerapan_kbat_kendiri" ${userKawasan.includes('pencerapan_kbat_kendiri') ? 'selected' : ''}>Pencerapan Kendiri</option>
                                <option value="pencerapan_kbat_pentadbir" ${userKawasan.includes('pencerapan_kbat_pentadbir') ? 'selected' : ''}>Pencerapan Pentadbir</option>
                            </optgroup>

                            <optgroup label="13. Standard Kualiti">
                                <option value="jk_standard_kualiti" ${userKawasan.includes('jk_standard_kualiti') ? 'selected' : ''}>JK Standard Kualiti</option>
                                <option value="panduan_standard_kualiti" ${userKawasan.includes('panduan_standard_kualiti') ? 'selected' : ''}>Buku Panduan</option>
                                <option value="standard_kurikulum" ${userKawasan.includes('standard_kurikulum') ? 'selected' : ''}>Standard Kurikulum</option>
                                <option value="instrumen_standard_kualiti" ${userKawasan.includes('instrumen_standard_kualiti') ? 'selected' : ''}>Instrumen Kualiti</option>
                            </optgroup>

                            <optgroup label="14. Pendigitalan ICT">
                                <option value="jk_ict" ${userKawasan.includes('jk_ict') ? 'selected' : ''}>JK ICT</option>
                            </optgroup>
                            
                        </select>
                        <p class="text-[11px] text-slate-500 mt-1 italic">*Tahan butang CTRL (Windows) atau CMD (Mac) untuk pilih lebih dari satu.</p>
                    </div>
                </td>
                <td class="p-4 text-right whitespace-nowrap align-top">
                    <button onclick="kemaskiniPeranan('${email}')" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-bold transition shadow-sm">
                        Simpan
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Ralat memuat senarai pengguna:", error);
        tbody.innerHTML = `<tr><td colspan="3" class="text-red-500 text-center p-4">Ralat: ${error.message}</td></tr>`;
    }
}

// =========================================================================
// 13. PENGURUSAN BARISAN GURU (ADMIN & DASHBOARD)
// =========================================================================

// A. Fungsi Paparkan Guru di Muka Depan (index.html)
function paparkanSenaraiGuru() {
    const ruang = document.getElementById('ruangSenaraiGuru');
    if (!ruang) return; 

    const qGuru = query(collection(db, "guru_skfls"));
    
    onSnapshot(qGuru, (snapshot) => {
        let senarai = [];
        snapshot.forEach(docSnap => senarai.push({ id: docSnap.id, ...docSnap.data() }));
        
        senarai.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));

        if (senarai.length === 0) {
            ruang.innerHTML = '<p class="text-slate-500 text-sm italic py-4">Belum ada maklumat pendidik ditambah.</p>';
            return;
        }

        let kadHtml = '';
        senarai.forEach(data => {
            let imgUrl = data.url_gambar;
            let fileId = "";

            if (imgUrl) {
                if (imgUrl.includes("/file/d/")) {
                    fileId = imgUrl.split("/file/d/")[1].split("/")[0];
                } else if (imgUrl.includes("id=")) {
                    fileId = imgUrl.split("id=")[1].split("&")[0];
                }
            }

            if (fileId) {
                imgUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`; 
            }

            const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nama)}&background=random&color=fff&size=200`;

            kadHtml += `
                <div class="shrink-0 w-36 md:w-40 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all flex flex-col">
                    <div class="h-40 md:h-48 bg-slate-200 w-full relative shrink-0">
                        <img src="${imgUrl}" alt="${data.nama}" class="absolute inset-0 w-full h-full object-cover" onerror="this.onerror=null;this.src='${fallbackAvatar}';">
                    </div>
                    <div class="p-3 text-center bg-white flex-1 flex flex-col justify-start">
                        <p class="font-bold text-slate-800 text-sm leading-tight mb-1">${data.nama}</p>
                        <p class="text-[10px] text-slate-500 mt-auto uppercase tracking-wider font-bold bg-slate-50 py-1 rounded-md">${data.jawatan}</p>
                    </div>
                </div>
            `;
        });

        ruang.innerHTML = kadHtml + kadHtml;

        let isPaused = false;
        ruang.addEventListener('mouseenter', () => isPaused = true);
        ruang.addEventListener('mouseleave', () => isPaused = false);
        ruang.addEventListener('touchstart', () => isPaused = true, { passive: true });
        ruang.addEventListener('touchend', () => isPaused = false);

        function gerakkanScroll() {
            if (!isPaused) {
                ruang.scrollLeft += 1; 
                if (ruang.scrollLeft >= ruang.scrollWidth / 2) {
                    ruang.scrollLeft = 0;
                }
            }
            requestAnimationFrame(gerakkanScroll);
        }

        gerakkanScroll();
    });
}

// B. Fungsi Borang Tambah Guru & Upload (admin.html)
const formTambahGuru = document.getElementById('formTambahGuru');
if (formTambahGuru) {
    formTambahGuru.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nama = document.getElementById('inputNamaGuru').value;
        const jawatan = document.getElementById('inputJawatanGuru').value;
        const fileInput = document.getElementById('inputGambarGuru');
        const file = fileInput.files[0];
        const btnSubmit = document.getElementById('btnSubmitGuru');
        const txtSubmit = document.getElementById('txtSubmitGuru');

        if (!file) return alert("Sila pilih gambar.");
        if (file.size > (5 * 1024 * 1024)) return alert("Saiz gambar terlalu besar. Maksimum 5MB.");
        
        try {
            btnSubmit.disabled = true;
            txtSubmit.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Memuat Naik...';

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async function() {
                const base64Data = reader.result.split(',')[1];
                const gasUrl = "https://script.google.com/macros/s/AKfycbyAeUulIKI140BefI4ovGqmzrifbPKJ5USstIoCZ-mV_OzH4PfR8d3cjxfJGy572zYxbg/exec";
                
                const responsGAS = await fetch(gasUrl, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({ filename: "GURU_" + Date.now() + "_" + file.name, mimeType: file.type, base64: base64Data })
                });
                const hasilGAS = await responsGAS.json();

                if (hasilGAS.status === 'success' || hasilGAS.url) {
                    await addDoc(collection(db, "guru_skfls"), {
                        nama: nama,
                        jawatan: jawatan,
                        url_gambar: hasilGAS.url,
                        timestamp: serverTimestamp()
                    });
                    
                    alert(`Profil ${nama} berjaya ditambah!`);
                    formTambahGuru.reset();
                } else {
                    alert("Gagal memuat naik gambar ke Google Drive.");
                }
                
                btnSubmit.disabled = false;
                txtSubmit.innerHTML = '<i class="fas fa-plus mr-2"></i>Tambah Ke Muka Depan';
            };
        } catch (error) {
            alert("Ralat muat naik: " + error.message);
            btnSubmit.disabled = false;
            txtSubmit.innerHTML = '<i class="fas fa-plus mr-2"></i>Tambah Ke Muka Depan';
        }
    });
}

// C. Fungsi Jadual Admin (Lihat, Edit & Padam) (admin.html)
function urusSenaraiGuru() {
    const jadual = document.getElementById('jadualPengurusanGuru');
    if (!jadual) return;

    const qGuru = query(collection(db, "guru_skfls"));
    
    onSnapshot(qGuru, (snapshot) => {
        let senarai = [];
        snapshot.forEach(docSnap => senarai.push({ id: docSnap.id, ...docSnap.data() }));
        senarai.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));

        if (senarai.length === 0) {
            jadual.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-slate-500">Tiada rekod. Sila muat naik guru di atas.</td></tr>';
            return;
        }

        let html = '';
        senarai.forEach(data => {
            let imgUrl = data.url_gambar;
            let fileId = "";

            if (imgUrl) {
                if (imgUrl.includes("/file/d/")) {
                    fileId = imgUrl.split("/file/d/")[1].split("/")[0];
                } else if (imgUrl.includes("id=")) {
                    fileId = imgUrl.split("id=")[1].split("&")[0];
                }
            }

            if (fileId) {
                imgUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w150`; 
            }

            const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nama)}&background=random&color=fff&size=150`;

            // Nama perlu 'escape' single quotes supaya tak rosakkan parameter function
            const namaPenuh = data.nama.replace(/'/g, "\\'");
            const jawatanPenuh = data.jawatan.replace(/'/g, "\\'");

            html += `
                <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td class="p-3 w-16">
                        <div class="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden relative border border-slate-200">
                            <img src="${imgUrl}" alt="Gambar" class="absolute inset-0 w-full h-full object-cover" onerror="this.onerror=null;this.src='${fallbackAvatar}';">
                        </div>
                    </td>
                    <td class="p-3 font-bold text-slate-800">${data.nama}</td>
                    <td class="p-3 text-slate-500 text-xs uppercase tracking-wider">${data.jawatan}</td>
                    <td class="p-3 text-right whitespace-nowrap">
                        <button onclick="editGuru('${data.id}', '${namaPenuh}', '${jawatanPenuh}')" class="bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-1.5 rounded-md text-xs font-bold transition mr-2">
                            <i class="fas fa-edit mr-1"></i> Edit
                        </button>
                        <button onclick="padamGuru('${data.id}', '${namaPenuh}')" class="bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded-md text-xs font-bold transition">
                            <i class="fas fa-trash mr-1"></i> Padam
                        </button>
                    </td>
                </tr>
            `;
        });
        jadual.innerHTML = html;
    });
}

// D1. Fungsi Edit Rekod (BARU)
window.editGuru = async function(id, namaLama, jawatanLama) {
    const namaBaru = prompt("Kemaskini Nama Guru:", namaLama);
    if (namaBaru === null || namaBaru.trim() === "") return; // Jika klik Cancel atau biar kosong

    const jawatanBaru = prompt("Kemaskini Jawatan Guru:", jawatanLama);
    if (jawatanBaru === null || jawatanBaru.trim() === "") return; // Jika klik Cancel atau biar kosong

    // Hantar perubahan ke pangkalan data jika ada yang ditukar
    if (namaBaru !== namaLama || jawatanBaru !== jawatanLama) {
        try {
            await updateDoc(doc(db, "guru_skfls", id), {
                nama: namaBaru.trim(),
                jawatan: jawatanBaru.trim()
            });
            // Tidak perlu alert berjaya kerana UI akan auto refresh (onSnapshot)
        } catch (error) {
            console.error("Ralat kemaskini:", error);
            alert("Ralat mengemaskini profil: " + error.message);
        }
    }
};

// D2. Fungsi Padam Rekod
window.padamGuru = async function(id, nama) {
    if (confirm(`Pasti mahu memadam profil Cikgu ${nama} dari muka depan?`)) {
        try {
            await deleteDoc(doc(db, "guru_skfls", id));
        } catch (error) {
            alert("Ralat memadam rekod: " + error.message);
        }
    }
};

// E. Panggil Fungsi secara Automatik
document.addEventListener("DOMContentLoaded", () => {
    paparkanSenaraiGuru(); 
    urusSenaraiGuru();     
});

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById("senarai-pengguna-body")) {
        muatSenaraiPengguna();
    }
});


// =========================================================================
// SISTEM NAVIGASI TAB ADMIN
// =========================================================================

window.tukarModulAdmin = function(modulId) {
    const senaraiModul = ['arkib', 'dokumen', 'akses', 'guru', 'tracker'];
    
    senaraiModul.forEach(id => {
        const kandungan = document.getElementById(`modul-${id}`);
        const butang = document.getElementById(`btn-modul-${id}`);
        
        if (!kandungan || !butang) return;

        if (id === modulId) {
            // Tunjuk Tab & Warnakan Butang
            kandungan.classList.remove('hidden');
            kandungan.classList.add('block');
            butang.className = "px-4 py-2 rounded-xl font-bold text-sm bg-blue-600 text-white shadow-sm transition";
            
            // --- JIKA KLIK TAB DOKUMEN ---
            if (id === 'dokumen' && typeof window.muatSemuaDokumenAdmin === 'function') {
                window.muatSemuaDokumenAdmin();
            }
            
            // --- JIKA KLIK TAB TRACKER ---
            // Kita panggil fungsi asal cikgu di sini. 
            // Cikgu boleh ubah "2026" kepada "semua" atau tahun yang cikgu mahu paparkan.
            if (id === 'tracker' && typeof janaTrackerPanitia === 'function') {
                janaTrackerPanitia("2026"); 
            }

        } else {
            // Sembunyi Tab & Kelabukan Butang
            kandungan.classList.remove('block');
            kandungan.classList.add('hidden');
            butang.className = "px-4 py-2 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition";
        }
    });
}
// WAJIB: Dedahkan fungsi ini ke global supaya onclick="tukarModulAdmin(...)" pada HTML boleh panggil ia
window.tukarModulAdmin = tukarModulAdmin;

// =========================================================================
// MODUL 2: PENGURUSAN SEMUA DOKUMEN GLOBAL (MASTER LIST) TUKAR KE "kandungan"
// =========================================================================

window.muatSemuaDokumenAdmin = async function() {
    const tbody = document.getElementById("senarai-semua-dokumen-body");
    if (!tbody) return;
    
    tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400"><i class="fas fa-spinner fa-spin mr-2"></i>Sedang menarik semua data dari Firebase...</td></tr>`;

    try {
        // NAMA COLLECTION TELAH DITUKAR KEPADA "kandungan" BERDASARKAN KOD CIKGU
        const querySnapshot = await getDocs(collection(db, "kandungan")); 
        
        tbody.innerHTML = "";

        if (querySnapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-500 font-medium">Tiada fail dijumpai di dalam pangkalan data.</td></tr>`;
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const docData = docSnap.data();
            const docId = docSnap.id;

            // Pastikan data ini wujud, kita cuba tangkap apa sahaja bentuk datanya
            const namaFolder = docData.folder_destinasi || docData.subjek || 'Umum';
            const tajuk = docData.tajuk || 'Tanpa Tajuk';
            const pemilik = docData.dimuat_naik_oleh || docData.dimuat_naik_emel || '-';

            const tr = document.createElement("tr");
            tr.className = "hover:bg-slate-50 border-b border-slate-100 text-sm transition-colors";
            tr.innerHTML = `
                <td class="p-4 font-semibold text-slate-800">${tajuk}</td>
                <td class="p-4">
                    <span class="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-1 rounded border border-slate-200 uppercase">
                        ${namaFolder}
                    </span>
                </td>
                <td class="p-4 text-slate-600 text-xs">${pemilik}</td>
                <td class="p-4 text-right space-x-2 whitespace-nowrap">
                    ${docData.url_fail ? `<a href="${docData.url_fail}" target="_blank" class="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-bold text-xs transition inline-block">Buka</a>` : ''}
                    <button onclick="padamDokumenAdmin('${docId}', '${docData.path_stor || docData.url_fail}')" class="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition shadow-sm">
                        <i class="fas fa-trash-alt mr-1"></i> Padam
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Ralat memuatkan Master List:", error);
        tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-500">Ralat Firebase: ${error.message}</td></tr>`;
    }
};

window.padamDokumenAdmin = async function(docId, storagePath) {
    if (!confirm("AMARAN: Adakah anda PASTI ingin memadam dokumen ini? Fail ini akan dipadam KEKAL.")) return;

    try {
        // Padam dari pangkalan data "kandungan"
        await deleteDoc(doc(db, "kandungan", docId));

        alert("Berjaya! Rekod dokumen telah dipadam.");
        window.muatSemuaDokumenAdmin(); // Refresh jadual secara automatik
    } catch (error) {
        alert("Gagal memadam dokumen: " + error.message);
    }
};
