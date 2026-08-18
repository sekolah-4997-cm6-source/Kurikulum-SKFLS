// ==========================================
// 1. SEMUA IMPORT MESTI DI ATAS SEKALI
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

// Hidupkan Sistem Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// ==========================================
// 3. LOGIK LOG MASUK & SEMAK PANGKAT (ROLE)
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
            const elemenAdmin = document.querySelectorAll('.hanya-admin');
            elemenAdmin.forEach(el => el.classList.remove('hidden'));
        }
    } else {
        if (txtLogin) txtLogin.textContent = "Log Masuk (DELIMa)";
        if (iconLogin) iconLogin.className = "fas fa-sign-in-alt mr-2";
        if (btnLogin) btnLogin.classList.remove('bg-red-50', 'border-red-200');
        
        const elemenAdmin = document.querySelectorAll('.hanya-admin');
        elemenAdmin.forEach(el => el.classList.add('hidden'));
    }
});

// ==========================================
// 4. LOGIK MUAT NAIK (BASE64 + GAS)
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

        // Ambil kod subjek dari link atas
        const urlParams = new URLSearchParams(window.location.search);
        const subjekSemasa = urlParams.get('subjek') || 'umum';

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
                    // Simpan ke Firestore
                    await addDoc(collection(db, "kandungan"), {
                        tajuk: tajuk,
                        subjek: subjekSemasa,
                        url_fail: hasilGAS.url,
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
