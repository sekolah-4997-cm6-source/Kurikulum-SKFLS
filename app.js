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
});
