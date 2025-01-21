import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBtCQA5t7jtQaC3vQVPSjV2UnHpLozVFZE",
    authDomain: "pinterest-838cd.firebaseapp.com",
    projectId: "pinterest-838cd",
    storageBucket: "pinterest-838cd.firebasestorage.app",
    messagingSenderId: "770794723608",
    appId: "1:770794723608:web:783166d73901e83eaaa66d",
    measurementId: "G-LM3V2F46R1"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Iniciar sesión con Google
document.getElementById("google-signin").addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);

        // Obtener información del usuario
        const user = result.user;
        const userRef = doc(db, "users", user.uid);

        // Guardar en Firestore
        await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName || "Sin nombre", // Si no hay nombre, usar predeterminado
            photoURL: user.photoURL || "", // Si no hay foto, guardar vacío
            email: user.email || "", // Si no hay email, guardar vacío
            createdAt: new Date().toISOString() // Fecha de creación
        });

        // Redirigir a chat
        window.location.href = "../home/chat.html";
    } catch (error) {
        console.error("Error al iniciar sesión:", error.message);
    }
});
