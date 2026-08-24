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

// Fungsi Pintar Semak Akses (Boleh diguna oleh fungsi Muat Naik/Padam)
window.semakKebenaranAkses = function(subjekDiuji) {
    if (window.isAdmin) return true; // Admin boleh buat semua perkara
    if ((window.userRole === "ketua_panitia" || window.userRole === "penyelaras") && window.userKawalan === subjekDiuji) {
        return true; // KP atau Penyelaras di halaman mereka sendiri
    }
    return false; // Selain itu, dilarang
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
    'visi_misi': 'Visi, Misi & Matlamat Sekolah', 'spi': 'Surat Pekeliling Ikhtisas (SPI)', 'dasar': 'Dasar & Penetapan Kurikulum', 'takwim': 'Perancangan Pelaksanaan Kurikulum',
    'mesyuarat_induk': 'Mesyuarat Kurikulum Induk', 'mmi': 'Mengurus Masa Instruksional (MMI)',
    'bm': 'Panitia Bahasa Melayu', 'bi': 'Panitia Bahasa Inggeris', 'mt': 'Panitia Matematik', 'sn': 'Panitia Sains', 'pi': 'Panitia Pendidikan Islam', 'pm': 'Panitia Pendidikan Moral',
    'sej': 'Panitia Sejarah', 'rbt': 'Panitia Reka Bentuk & Teknologi', 'psv': 'Panitia Pendidikan Seni Visual', 'mz': 'Panitia Pendidikan Muzik', 'pjpk': 'Panitia PJPK', 'ba': 'Panitia Bahasa Arab',
    'plan': 'Program PLaN', 'pemulihan': 'Pemulihan Khas', 'transisi': 'Program Transisi Tahun 1', 'intervensi_t1': 'Intervensi Tahun 1 (3M)',
    'pss': 'Pusat Sumber Sekolah (PSS)', 'pra': 'Prasekolah', 'umum': 'One-Stop Centre'
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

// ==========================================
// 10. JADUAL TRACKER KESELURUHAN (PANITIA & BUKAN PANITIA)
// ==========================================
function janaTrackerPanitia(tahun) {
    const trackerTableBody = document.getElementById('jadualTrackerBody');
    if (!trackerTableBody) return; 

    const labelTahunTracker = document.getElementById('labelTahunTracker');
    if (labelTahunTracker) labelTahunTracker.innerText = tahun;
    
    trackerTableBody.innerHTML = '<tr><td colspan="6" class="text-center p-8 text-slate-500"><i class="fas fa-spinner fa-spin text-2xl mb-2 block"></i>Menyemak Pangkalan Data...</td></tr>';

    const senaraiSemuaPanitia = [
        { id: "bm", nama: "B. Melayu" }, { id: "bi", nama: "B. Inggeris" },
        { id: "mt", nama: "Matematik" }, { id: "sn", nama: "Sains" },
        { id: "pi", nama: "Pend. Islam" }, { id: "pm", nama: "Pend. Moral" },
        { id: "sej", nama: "Sejarah" }, { id: "rbt", nama: "RBT" },
        { id: "psv", nama: "Pend. Seni Visual" }, { id: "mz", nama: "Pend. Muzik" },
        { id: "pjpk", nama: "PJPK" }, { id: "ba", nama: "B. Arab" }
    ];

    try {
        const qTracker = query(collection(db, "kandungan"), where("status", "==", "aktif"));
        
        if (unsubscribeTracker) unsubscribeTracker();

        unsubscribeTracker = onSnapshot(qTracker, (snapshot) => {
            let dataSubjek = {};
            senaraiSemuaPanitia.forEach(p => { dataSubjek[p.id] = { fail_1: 0, fail_2: 0, fail_3: 0, fail_4: 0 }; });

            let dataBukanPanitia = {
                'visi_misi': 0, 'spi': 0, 'dasar': 0, 'takwim': 0,
                'mesyuarat_induk': 0, 'mmi': 0,
                'plan': 0, 'pemulihan': 0, 'transisi': 0, 'intervensi_t1': 0,
                'pss': 0, 'pra': 0
            };

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                
                if (tahun && tahun.toLowerCase() !== "semua") {
                    const docTahun = data.tahun ? String(data.tahun).toLowerCase() : "";
                    const filterKecil = String(tahun).toLowerCase();
                    if (docTahun !== "" && !docTahun.includes(filterKecil) && !filterKecil.includes(docTahun)) return; 
                }
                
                const subjek = data.subjek ? String(data.subjek).toLowerCase() : "";
                
                if (dataSubjek[subjek]) {
                    let folder = data.folder_destinasi;
                    if (!['fail_1', 'fail_2', 'fail_3', 'fail_4'].includes(folder)) folder = 'fail_1'; 
                    dataSubjek[subjek][folder]++;
                }

                if (dataBukanPanitia[subjek] !== undefined) {
                    dataBukanPanitia[subjek]++;
                }
            });

            let htmlTracker = "";
            senaraiSemuaPanitia.forEach(p => {
                const kiraan = dataSubjek[p.id];
                const formatKotak = (jumlah) => jumlah > 0 
                    ? `<span class="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200"><i class="fas fa-check"></i> (${jumlah})</span>`
                    : `<span class="text-slate-400 bg-slate-50 px-2 py-1 rounded"><i class="fas fa-times"></i> (0)</span>`;

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
                    </tr>`;
            });
            trackerTableBody.innerHTML = htmlTracker;

            const renderBukanPanitia = (kumpulanData, targetId) => {
                const targetEl = document.getElementById(targetId);
                if (!targetEl) return;
                
                let html = "";
                kumpulanData.forEach(item => {
                    const jumlah = dataBukanPanitia[item.id];
                    const statusIkon = jumlah > 0 
                        ? `<span class="text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-200 shadow-sm"><i class="fas fa-check-circle mr-1"></i>Ada (${jumlah})</span>`
                        : `<span class="text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md text-xs border border-slate-200"><i class="fas fa-times-circle mr-1 text-slate-400"></i>Tiada (0)</span>`;
                    
                    html += `
                        <tr class="hover:bg-slate-50 transition">
                            <td class="p-3 font-medium text-slate-700 w-2/3">${item.nama}</td>
                            <td class="p-3 text-right w-1/3">${statusIkon}</td>
                        </tr>`;
                });
                targetEl.innerHTML = html;
            };

            renderBukanPanitia([
                { id: 'visi_misi', nama: 'Visi & Misi' }, { id: 'spi', nama: 'Pekeliling (SPI)' },
                { id: 'dasar', nama: 'Dasar & Penetapan' }, { id: 'takwim', nama: 'Takwim & Carta' }
            ], 'trackerMaklumatInduk');

            renderBukanPanitia([
                { id: 'mesyuarat_induk', nama: 'Mesyuarat Induk' }, { id: 'mmi', nama: 'Pengurusan Masa (MMI)' }
            ], 'trackerMesyuarat');

            renderBukanPanitia([
                { id: 'plan', nama: 'PLaN' }, { id: 'pemulihan', nama: 'Pemulihan Khas' },
                { id: 'transisi', nama: 'Transisi Tahun 1' }, { id: 'intervensi_t1', nama: 'Intervensi Tahun 1' }
            ], 'trackerProgram');

            renderBukanPanitia([
                { id: 'pss', nama: 'Pusat Sumber (PSS)' }, { id: 'pra', nama: 'Prasekolah' }
            ], 'trackerSokongan');

        });

    } catch (error) {
        console.error("Ralat Tracker:", error);
        trackerTableBody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-red-500">Ralat: ${error.message}</td></tr>`;
    }
}

// =========================================================================
// 11. PENGURUSAN AKSES PENGGUNA (ADMIN PANEL)
// =========================================================================

async function muatSenaraiPengguna() {
    const tbody = document.getElementById("senarai-pengguna-body");
    if (!tbody) return; 

    try {
        const querySnapshot = await getDocs(collection(db, "pengguna"));
        tbody.innerHTML = ""; 

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const email = docSnap.id;
            const emailSafe = email.replace(/[@.]/g, ''); 

            // Pastikan kawasan adalah array, jika tiada jadikan array kosong
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
                    <!-- Dropdown Peranan Utama -->
                    <select id="role-${emailSafe}" onchange="tukarPaparanKawasan('${emailSafe}')" class="border border-slate-300 rounded-lg p-2 w-full text-sm outline-none mb-2">
                        <option value="guru" ${data.peranan === 'guru' ? 'selected' : ''}>Guru Biasa</option>
                        <option value="akses_khas" ${data.peranan === 'akses_khas' ? 'selected' : ''}>Akses Khas (Panitia / Penyelaras)</option>
                        <option value="admin" ${data.peranan === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                    
                    <!-- Dropdown Kawasan (Multi-Select) -->
                    <div id="div-kawasan-${emailSafe}" class="${hideKawasan}">
                        <select id="kawasan-${emailSafe}" multiple class="border border-slate-300 rounded-lg p-2 w-full text-sm outline-none h-40">
                            <optgroup label="Panitia (12 Subjek)">
                                <option value="bm" ${userKawasan.includes('bm') ? 'selected' : ''}>Bahasa Melayu</option>
                                <option value="bi" ${userKawasan.includes('bi') ? 'selected' : ''}>Bahasa Inggeris</option>
                                <option value="mt" ${userKawasan.includes('mt') ? 'selected' : ''}>Matematik</option>
                                <option value="sn" ${userKawasan.includes('sn') ? 'selected' : ''}>Sains</option>
                                <option value="pai" ${userKawasan.includes('pai') ? 'selected' : ''}>Pendidikan Islam</option>
                                <option value="ba" ${userKawasan.includes('ba') ? 'selected' : ''}>Bahasa Arab</option>
                                <option value="sejarah" ${userKawasan.includes('sejarah') ? 'selected' : ''}>Sejarah</option>
                                <option value="rbt" ${userKawasan.includes('rbt') ? 'selected' : ''}>RBT</option>
                                <option value="psv" ${userKawasan.includes('psv') ? 'selected' : ''}>PSV</option>
                                <option value="pjpk" ${userKawasan.includes('pjpk') ? 'selected' : ''}>PJPK</option>
                                <option value="muzik" ${userKawasan.includes('muzik') ? 'selected' : ''}>Pend. Muzik</option>
                                <option value="pm" ${userKawasan.includes('pm') ? 'selected' : ''}>Pend. Moral</option>
                            </optgroup>
                            
                            <optgroup label="Penyelaras (Bahagian Lain)">
                                <option value="visi_misi" ${userKawasan.includes('visi_misi') ? 'selected' : ''}>Visi & Misi</option>
                                <option value="spi" ${userKawasan.includes('spi') ? 'selected' : ''}>SPI</option>
                                <option value="dasar" ${userKawasan.includes('dasar') ? 'selected' : ''}>Dasar Kurikulum</option>
                                <option value="takwim" ${userKawasan.includes('takwim') ? 'selected' : ''}>Takwim</option>
                                <option value="mesyuarat_induk" ${userKawasan.includes('mesyuarat_induk') ? 'selected' : ''}>Mesyuarat Induk</option>
                                <option value="mmi" ${userKawasan.includes('mmi') ? 'selected' : ''}>MMI</option>
                                <option value="plan" ${userKawasan.includes('plan') ? 'selected' : ''}>Program PLaN</option>
                                <option value="pemulihan" ${userKawasan.includes('pemulihan') ? 'selected' : ''}>Pemulihan</option>
                                <option value="transisi" ${userKawasan.includes('transisi') ? 'selected' : ''}>Transisi</option>
                                <option value="intervensi_t1" ${userKawasan.includes('intervensi_t1') ? 'selected' : ''}>Intervensi T1</option>
                                <option value="pss" ${userKawasan.includes('pss') ? 'selected' : ''}>PSS</option>
                                <option value="pra" ${userKawasan.includes('pra') ? 'selected' : ''}>Pra Sekolah</option>
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
        tbody.innerHTML = `<tr><td colspan="3" class="text-red-500 text-center p-4">Gagal memuatkan data.</td></tr>`;
    }
}

window.tukarPaparanKawasan = function(emailSafe) {
    const roleSelect = document.getElementById(`role-${emailSafe}`).value;
    const divKawasan = document.getElementById(`div-kawasan-${emailSafe}`);
    
    if (roleSelect === 'akses_khas') {
        divKawasan.classList.remove('hidden');
    } else {
        divKawasan.classList.add('hidden');
        Array.from(document.getElementById(`kawasan-${emailSafe}`).options).forEach(opt => opt.selected = false);
    }
};

window.kemaskiniPeranan = async function(email) {
    const emailSafe = email.replace(/[@.]/g, '');
    const roleBaru = document.getElementById(`role-${emailSafe}`).value;
    const kawasanSelect = document.getElementById(`kawasan-${emailSafe}`);
    
    // Dapatkan semua kawasan yang dipilih dan masukkan dalam Array
    const kawasanDipilih = Array.from(kawasanSelect.selectedOptions).map(opt => opt.value);

    if (roleBaru === 'akses_khas' && kawasanDipilih.length === 0) {
        return alert("Sila pilih sekurang-kurangnya satu Subjek/Kawasan seliaan untuk pengguna ini.");
    }

    const sah = confirm(`Adakah anda pasti mahu menukar akses ${email}?`);
    if (!sah) return;

    try {
        const userRef = doc(db, "pengguna", email);
        await updateDoc(userRef, {
            peranan: roleBaru,
            kawasan: kawasanDipilih 
        });
        alert(`Berjaya! Akses untuk ${email} telah dikemaskini.`);
    } catch (error) {
        console.error("Ralat mengemaskini peranan:", error);
        alert("Gagal mengemaskini peranan.");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("senarai-pengguna-body")) {
        muatSenaraiPengguna();
    }
});


// =========================================================================
// 13. PENGURUSAN BARISAN GURU (ADMIN & DASHBOARD)
// =========================================================================

// A. Fungsi Paparkan Guru di Muka Depan (index.html) - VERSI AUTO & MANUAL SCROLL (Nama Penuh)
function paparkanSenaraiGuru() {
    const ruang = document.getElementById('ruangSenaraiGuru');
    if (!ruang) return; 

    const qGuru = query(collection(db, "guru_skfls"));
    
    onSnapshot(qGuru, (snapshot) => {
        let senarai = [];
        snapshot.forEach(docSnap => senarai.push({ id: docSnap.id, ...docSnap.data() }));
        
        // Susun ikut yang terawal dimasukkan
        senarai.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));

        if (senarai.length === 0) {
            ruang.innerHTML = '<p class="text-slate-500 text-sm italic py-4">Belum ada maklumat pendidik ditambah.</p>';
            return;
        }

        let kadHtml = '';
        senarai.forEach(data => {
            let imgUrl = data.url_gambar;
            let fileId = "";

            // Tangkap ID gambar dari pelbagai jenis link Google Drive
            if (imgUrl) {
                if (imgUrl.includes("/file/d/")) {
                    fileId = imgUrl.split("/file/d/")[1].split("/")[0];
                } else if (imgUrl.includes("id=")) {
                    fileId = imgUrl.split("id=")[1].split("&")[0];
                }
            }

            // Guna Thumbnail API Google Drive supaya tak disekat
            if (fileId) {
                imgUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`; 
            }

            // Gambar sandaran (fallback) jika tiada/gagal
            const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nama)}&background=random&color=fff&size=200`;

            kadHtml += `
                <div class="shrink-0 w-36 md:w-40 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all flex flex-col">
                    <div class="h-40 md:h-48 bg-slate-200 w-full relative shrink-0">
                        <img src="${imgUrl}" alt="${data.nama}" class="absolute inset-0 w-full h-full object-cover" onerror="this.onerror=null;this.src='${fallbackAvatar}';">
                    </div>
                    <div class="p-3 text-center bg-white flex-1 flex flex-col justify-start">
                        <!-- Perubahan di sini: Buang line-clamp-1 supaya nama boleh dua baris -->
                        <p class="font-bold text-slate-800 text-sm leading-tight mb-1">${data.nama}</p>
                        <p class="text-[10px] text-slate-500 mt-auto uppercase tracking-wider font-bold bg-slate-50 py-1 rounded-md">${data.jawatan}</p>
                    </div>
                </div>
            `;
        });

        // Salin (Duplicate) kad 2 kali untuk efek loop tanpa putus
        ruang.innerHTML = kadHtml + kadHtml;

        // ============================================
        // LOGIK AUTOSCROLL & MANUAL SCROLL
        // ============================================
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

// C. Fungsi Jadual Admin (Lihat & Padam) (admin.html)
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

            // Paparan jadual admin (saiz imej lebih kecil: w150)
            if (fileId) {
                imgUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w150`; 
            }

            const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nama)}&background=random&color=fff&size=150`;

            html += `
                <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td class="p-3">
                        <div class="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden relative border border-slate-200">
                            <img src="${imgUrl}" alt="Gambar" class="absolute inset-0 w-full h-full object-cover" onerror="this.onerror=null;this.src='${fallbackAvatar}';">
                        </div>
                    </td>
                    <td class="p-3 font-bold text-slate-800">${data.nama}</td>
                    <td class="p-3 text-slate-500 text-xs uppercase tracking-wider">${data.jawatan}</td>
                    <td class="p-3 text-right">
                        <button onclick="padamGuru('${data.id}', '${data.nama}')" class="bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded-md text-xs font-bold transition">
                            <i class="fas fa-trash mr-1"></i> Padam
                        </button>
                    </td>
                </tr>
            `;
        });
        jadual.innerHTML = html;
    });
}

// D. Fungsi Padam Rekod
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
