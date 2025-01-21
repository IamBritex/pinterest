// Importar Firebase desde los módulos CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBtCQA5t7jtQaC3vQVPSjV2UnHpLozVFZE",
    authDomain: "pinterest-838cd.firebaseapp.com",
    projectId: "pinterest-838cd",
    storageBucket: "pinterest-838cd.firebasestorage.app",
    messagingSenderId: "770794723608",
    appId: "1:770794723608:web:783166d73901e83eaaa66d",
    measurementId: "G-LM3V2F46R1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Verificar el estado de autenticación
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Usuario autenticado, redirigir a home/chat.html
        window.location.href = "home/chat.html";
    } else {
        // Usuario no autenticado, redirigir a auth/register.html
        window.location.href = "register.html";
    }
});
