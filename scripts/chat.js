import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, query, onSnapshot, where, getDocs, orderBy, addDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

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

// Referencias a elementos del DOM
const backArrow = document.getElementById("back-arrow");
const receiverName = document.getElementById("receiver-name");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const messageContainer = document.getElementById("message-container");
const waitingContainer = document.getElementById("waiting-container");

// Función principal
auth.onAuthStateChanged(async (user) => {
    if (!user) return (window.location.href = "/auth/register.html");

    const currentUserUid = user.uid;

    // Obtener todos los usuarios registrados
    const usersQuery = query(collection(db, "users"));
    const usersSnapshot = await getDocs(usersQuery);

    if (usersSnapshot.size < 2) {
        // Si no hay dos usuarios registrados, mostrar la animación de espera
        waitingContainer.style.display = "flex";
        messageInput.disabled = true;
        sendButton.disabled = true;
        return;
    }

    // Ocultar el contenedor de espera cuando haya dos usuarios registrados
    waitingContainer.style.display = "none";
    messageInput.disabled = false;
    sendButton.disabled = false;

    // Identificar al receptor (el otro usuario)
    const otherUser = usersSnapshot.docs.find(doc => doc.id !== currentUserUid);
    const receiverUid = otherUser.id;

    // Mostrar el nombre del receptor
    receiverName.textContent = otherUser.data().displayName || "Usuario";

    // Escuchar mensajes en tiempo real
    const messagesQuery = query(
        collection(db, "messages"),
        where("remitente", "in", [currentUserUid, receiverUid]),
        where("receptor", "in", [currentUserUid, receiverUid]),
        orderBy("fecha", "asc")
    );

    onSnapshot(messagesQuery, (snapshot) => {
        messageContainer.innerHTML = ""; // Limpiar mensajes
        snapshot.forEach((doc) => {
            const data = doc.data();
            const messageElement = document.createElement("div");
            messageElement.classList.add("message");
            messageElement.classList.add(data.remitente === currentUserUid ? "sent" : "received");
            messageElement.textContent = data.texto;
            messageContainer.appendChild(messageElement);
        });
        messageContainer.scrollTop = messageContainer.scrollHeight; // Desplazar al último mensaje
    });

    // Enviar mensaje
    sendButton.addEventListener("click", async () => {
        const texto = messageInput.value.trim();
        if (!texto) return;

        await addDoc(collection(db, "messages"), {
            remitente: currentUserUid,
            receptor: receiverUid,
            texto,
            fecha: new Date().toISOString(),
            read: false
        });

        messageInput.value = ""; // Limpiar input
    });

    // Regresar a Pinterest
    backArrow.addEventListener("click", () => {
        window.location.href = "https://pinterest.com";
    });
});
