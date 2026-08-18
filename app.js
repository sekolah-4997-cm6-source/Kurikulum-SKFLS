// 1. Tarik modul dari Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 2. TAMPAL CONFIG FIREBASE ANDA DI SINI
const firebaseConfig = {
  apiKey: "AIzaSyDhEer81oa5wGndqr5dKRwFwVeSahwaUjo",
  authDomain: "kurikulum-skfls.firebaseapp.com",
  projectId: "kurikulum-skfls",
  storageBucket: "kurikulum-skfls.firebasestorage.app",
  messagingSenderId: "401976347574",
  appId: "1:401976347574:web:8970f2dab85aa03faf0f17"
};

// 3. Hidupkan Sistem Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// 4. Kenal pasti butang-butang di skrin
const btnLogin = document.getElementById('btnLogin');
const txtLogin = document.getElementById('txtLogin');
const iconLogin = document.getElementById('iconLogin');

// 5. Logik Butang Log Masuk/Keluar
if (btnLogin) {
    btnLogin.addEventListener('click', () => {
        if (auth.currentUser) signOut(auth);
        else signInWithPopup(auth, provider).catch(e => alert(e.message));
    });
}

// 6. Pantau Pangkat (Role) Pengguna Secara Live
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // --- JIKA BERJAYA LOG MASUK ---
        if (txtLogin) txtLogin.textContent = "Log Keluar (" + user.displayName + ")";
        if (iconLogin) iconLogin.className = "fas fa-sign-out-alt mr-2 text-red-500";
        if (btnLogin) btnLogin.classList.add('bg-red-50', 'border-red-200');

        // Semak di pangkalan data adakah dia admin
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        let userRole = 'awam'; // Status lalai (Cikgu biasa)
        if (userSnap.exists()) {
            userRole = userSnap.data().role;
        } else {
            // Cipta profil baru jika pertama kali masuk
            await setDoc(userRef, {
                nama: user.displayName, email: user.email, role: 'awam'
            });
        }

        // Tunjuk butang/fungsi rahsia JIKA dia adalah admin
        if (userRole === 'admin' || userRole === 'pengurus') {
            const elemenAdmin = document.querySelectorAll('.hanya-admin');
            elemenAdmin.forEach(el => el.classList.remove('hidden'));
        }

    } else {
        // --- JIKA BELUM LOG MASUK / LOG KELUAR ---
        if (txtLogin) txtLogin.textContent = "Log Masuk (DELIMa)";
        if (iconLogin) iconLogin.className = "fas fa-sign-in-alt mr-2";
        if (btnLogin) btnLogin.classList.remove('bg-red-50', 'border-red-200');
        
        // Sembunyikan semua elemen admin dengan serta-merta
        const elemenAdmin = document.querySelectorAll('.hanya-admin');
        elemenAdmin.forEach(el => el.classList.add('hidden'));
    }
  // ==========================================
// FASA 5: LOGIK MUAT NAIK (BASE64 + GAS)
// ==========================================

// Pautkan elemen di skrin panitia.html
const modalUpload = document.getElementById('modalUpload');
const btnBukaModal = document.getElementById('btnBukaModal');
const btnTutupModal = document.getElementById('btnTutupModal');
const formUpload = document.getElementById('formUpload');
const btnSubmitUpload = document.getElementById('btnSubmitUpload');
const txtSubmit = document.getElementById('txtSubmit');

// Fungsi Buka/Tutup Modal (Hanya jalan jika elemen ini wujud di skrin)
if (btnBukaModal && modalUpload && btnTutupModal) {
    btnBukaModal.addEventListener('click', () => modalUpload.classList.remove('hidden'));
    btnTutupModal.addEventListener('click', () => {
        modalUpload.classList.add('hidden');
        formUpload.reset();
    });
}

// Apabila butang Muat Naik ditekan
if (formUpload) {
    formUpload.addEventListener('submit', async (e) => {
        e.preventDefault(); // Halang website dari refresh
        
        const file = document.getElementById('inputFail').files[0];
        const tajuk = document.getElementById('inputTajuk').value;
        const user = auth.currentUser;

        if (!file || !user) return;

        // Ambil kod subjek dari URL (cth: panitia.html?subjek=bm -> dapat "bm")
        const urlParams = new URLSearchParams(window.location.search);
        const subjekSemasa = urlParams.get('subjek') || 'umum';

        try {
            // Tukar butang kepada status loading
            btnSubmitUpload.disabled = true;
            btnSubmitUpload.classList.replace('bg-blue-600', 'bg-slate-400');
            txtSubmit.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Memproses ke Drive...';

            // --- PROSES 1: Tukar fail ke Base64 ---
            const reader = new FileReader();
            reader.readAsDataURL(file);
            
            reader.onload = async function() {
                // Buang perkataan depan (data:application/pdf;base64,)
                const base64Data = reader.result.split(',')[1]; 
                
                const dataKeGAS = {
                    filename: file.name,
                    mimeType: file.type,
                    base64: base64Data
                };

                // --- PROSES 2: Hantar ke Google Apps Script (GAS) ---
                // Pautan Web App anda yang hebat itu!
                const gasUrl = "https://script.google.com/macros/s/AKfycbxJgaxqjiSwkBcr-v9ICWtYOwc8zbtLO3qHE4ptVPPNPUkGVg86PlKcjD9K1thpz6XX5g/exec";
                
                txtSubmit.innerHTML = '<i class="fas fa-cloud-upload-alt mr-2"></i> Sedang memuat naik...';
                
                // Gunakan text/plain supaya pelayar web tak sekat (CORS bypass)
                const responsGAS = await fetch(gasUrl, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify(dataKeGAS)
                });
                
                const hasilGAS = await responsGAS.json();

                if (hasilGAS.status === 'success') {
                    // --- PROSES 3: Simpan nama fail & link Drive ke Firestore ---
                    import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
                    
                    await addDoc(collection(db, "kandungan"), {
                        tajuk: tajuk,
                        subjek: subjekSemasa,
                        url_fail: hasilGAS.url, // Link sebenar dari Google Drive!
                        dimuat_naik_oleh: user.displayName,
                        uid_pemuat_naik: user.uid,
                        tarikh: serverTimestamp()
                    });

                    alert("Berjaya! Fail anda telah selamat masuk ke Google Drive dan Firebase.");
                    modalUpload.classList.add('hidden');
                    formUpload.reset();

                } else {
                    throw new Error(hasilGAS.message);
                }

                // Kembalikan butang kepada asal
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
});
