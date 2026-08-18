// ==========================================
// 1. IMPORT MODUL FIREBASE
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ==========================================
// 2. TAMPAL CONFIG FIREBASE ANDA DI SINI
// ==========================================
const firebaseConfig = {
    apiKey: "LETAK_API_KEY_ANDA",
    authDomain: "LETAK_AUTH_DOMAIN_ANDA",
    projectId: "LETAK_PROJECT_ID",
    storageBucket: "LETAK_STORAGE_BUCKET",
    messagingSenderId: "LETAK_SENDER_ID",
    appId: "LETAK_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// Kita buat pembolehubah global supaya sistem tahu siapa admin
window.isAdmin = false;

// ==========================================
// 3. LOGIK LOG MASUK & PANGKAT ADMIN
// ==========================================
const btnLogin = document.getElementById('btnLogin');
const txtLogin = document.getElementById('txtLogin');
const iconLogin = document.getElementById('iconLogin');

if (btnLogin) {
    btnLogin.addEventListener('click', () => {
        if (auth.currentUser) signOut(auth);
        else signInWithPopup(auth, provider).catch(e => alert(e.message));
    });
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        if (txtLogin) txtLogin.textContent = "Log Keluar (" + user.displayName + ")";
        if (iconLogin) iconLogin.className = "fas fa-sign-out-alt mr-2 text-red-500";
        if (btnLogin) btnLogin.classList.add('bg-red-50', 'border-red-200');

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        let userRole = 'awam';
        if (userSnap.exists()) {
            userRole = userSnap.data().role;
        } else {
            await setDoc(userRef, { nama: user.displayName, email: user.email, role: 'awam' });
        }

        // Tunjuk butang admin jika ada kebenaran
        if (userRole === 'admin' || userRole === 'pengurus') {
            window.isAdmin = true;
            document.querySelectorAll('.hanya-admin').forEach(el => el.classList.remove('hidden'));
        }
    } else {
        if (txtLogin) txtLogin.textContent = "Log Masuk (DELIMa)";
        if (iconLogin) iconLogin.className = "fas fa-sign-in-alt mr-2";
        if (btnLogin) btnLogin.classList.remove('bg-red-50', 'border-red-200');
        
        window.isAdmin = false;
        document.querySelectorAll('.hanya-admin').forEach(el => el.classList.add('hidden'));
    }
});

// ==========================================
// 4. DAPATKAN MAKLUMAT MUKA SURAT SEMASA
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
const subjekSemasa = urlParams.get('subjek') || 'umum';

const senaraiNamaPanitia = {
    'bm': 'Panitia Bahasa Melayu',
    'bi': 'Panitia Bahasa Inggeris',
    'mt': 'Panitia Matematik',
    'sn': 'Panitia Sains',
    'pi': 'Panitia Pendidikan Islam'
};

const tajukPanitia = document.getElementById('tajukPanitia');
if (tajukPanitia) {
    // Tukar tajuk secara automatik (jika nama subjek tiada dalam senarai, tulis 'Senarai Bahan')
    tajukPanitia.textContent = senaraiNamaPanitia[subjekSemasa] || 'Senarai Bahan';
}


// ==========================================
// 5. BACA & PAPARKAN JADUAL SECARA LIVE
// ==========================================
const ruangJadual = document.getElementById('ruangJadual');

if (ruangJadual) {
    // Arahkan Firestore cari fail yang "subjek" nya sama dengan muka surat sekarang
    const q = query(collection(db, "kandungan"), where("subjek", "==", subjekSemasa));
    
    // onSnapshot akan baca data secara "Live". Kalau ada orang upload, ia terus muncul tanpa refresh!
    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            ruangJadual.innerHTML = '<p class="text-center text-slate-400 py-10"><i class="fas fa-folder-open text-4xl mb-3 block"></i> Belum ada bahan dimuat naik.</p>';
            return;
        }

        let htmlJadual = `
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-slate-100 text-slate-600 text-sm border-b border-slate-200">
                        <th class="p-4 font-medium rounded-tl-lg">Tajuk Dokumen</th>
                        <th class="p-4 font-medium hidden md:table-cell">Dimuat Naik Oleh</th>
                        <th class="p-4 font-medium">Tarikh</th>
                        <th class="p-4 font-medium text-right rounded-tr-lg">Tindakan</th>
                    </tr>
                </thead>
                <tbody class="text-sm">
        `;

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id; // ID unik rekod ini
            
            // Format Tarikh
            let tarikhMasa = "Baru sahaja";
            if (data.tarikh) {
                tarikhMasa = data.tarikh.toDate().toLocaleDateString('ms-MY');
            }

            htmlJadual += `
                <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td class="p-4 font-medium text-slate-800">
                        <i class="fas fa-file-pdf text-red-500 mr-2 text-lg"></i> ${data.tajuk}
                    </td>
                    <td class="p-4 text-slate-500 hidden md:table-cell">${data.dimuat_naik_oleh}</td>
                    <td class="p-4 text-slate-500">${tarikhMasa}</td>
                    <td class="p-4 text-right whitespace-nowrap">
                        <a href="${data.url_fail}" target="_blank" class="inline-block bg-blue-100 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-200 transition text-xs font-bold mr-2">
                            <i class="fas fa-external-link-alt"></i> Buka
                        </a>
                        <button onclick="padamRekod('${id}')" class="hanya-admin hidden bg-red-100 text-red-700 px-3 py-2 rounded-md hover:bg-red-200 transition text-xs font-bold" title="Padam Fail">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        htmlJadual += `</tbody></table></div>`;
        ruangJadual.innerHTML = htmlJadual;

        // Pastikan butang Tong Sampah muncul jika pengguna itu adalah admin
        if (window.isAdmin) {
            document.querySelectorAll('.hanya-admin').forEach(el => el.classList.remove('hidden'));
        }
    });
}

// Fungsi Padam Rekod (Dipanggil oleh butang Tong Sampah)
window.padamRekod = async function(id) {
    const sah = confirm("Adakah anda pasti mahu memadam rekod ini?");
    if (sah) {
        try {
            await deleteDoc(doc(db, "kandungan", id));
            alert("Berjaya dipadam.");
        } catch (error) {
            alert("Ralat memadam: " + error.message);
        }
    }
}

// ==========================================
// 6. LOGIK MUAT NAIK (BASE64 + GAS)
// ==========================================
const modalUpload = document.getElementById('modalUpload');
const btnBukaModal = document.getElementById('btnBukaModal');
const btnTutupModal = document.getElementById('btnTutupModal');
const formUpload = document.getElementById('formUpload');
const btnSubmitUpload = document.getElementById('btnSubmitUpload');
const txtSubmit = document.getElementById('txtSubmit');

if (btnBukaModal && modalUpload && btnTutupModal) {
    btnBukaModal.addEventListener('click', () => modalUpload.classList.remove('hidden'));
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
        const user = auth.currentUser;

        if (!file || !user) return;

        try {
            btnSubmitUpload.disabled = true;
            btnSubmitUpload.classList.replace('bg-blue-600', 'bg-slate-400');
            txtSubmit.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Memproses ke Drive...';

            const reader = new FileReader();
            reader.readAsDataURL(file);
            
            reader.onload = async function() {
                const base64Data = reader.result.split(',')[1]; 
                const dataKeGAS = {
                    filename: file.name,
                    mimeType: file.type,
                    base64: base64Data
                };

                const gasUrl = "https://script.google.com/macros/s/AKfycbxJgaxqjiSwkBcr-v9ICWtYOwc8zbtLO3qHE4ptVPPNPUkGVg86PlKcjD9K1thpz6XX5g/exec";
                
                txtSubmit.innerHTML = '<i class="fas fa-cloud-upload-alt mr-2"></i> Sedang memuat naik...';
                
                const responsGAS = await fetch(gasUrl, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify(dataKeGAS)
                });
                
                const hasilGAS = await responsGAS.json();

                if (hasilGAS.status === 'success') {
                    await addDoc(collection(db, "kandungan"), {
                        tajuk: tajuk,
                        subjek: subjekSemasa,
                        url_fail: hasilGAS.url,
                        dimuat_naik_oleh: user.displayName,
                        uid_pemuat_naik: user.uid,
                        tarikh: serverTimestamp()
                    });

                    // Kita guna alert biasa, tak perlu refresh sebab jadual akan update secara LIVE
                    alert("Berjaya! Fail anda telah selamat masuk.");
                    modalUpload.classList.add('hidden');
                    formUpload.reset();

                } else {
                    throw new Error(hasilGAS.message);
                }

                btnSubmitUpload.disabled = false;
                btnSubmitUpload.classList.replace('bg-slate-400', 'bg-blue-600');
                txtSubmit.innerHTML = 'Muat Naik Sekarang';
            };

        } catch (error) {
            console.error(error);
            alert("Ralat memuat naik: " + error.message);
            
            btnSubmitUpload.disabled = false;
            btnSubmitUpload.classList.replace('bg-slate-400', 'bg-blue-600');
            txtSubmit.innerHTML = 'Cuba Lagi';
        }
    });
}
