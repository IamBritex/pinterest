import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js"
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js"
import {
  getFirestore,
  collection,
  getDocs,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  where,
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js"
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-messaging.js"


document.addEventListener("DOMContentLoaded", async () => {
  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyBtCQA5t7jtQaC3vQVPSjV2UnHpLozVFZE",
    authDomain: "pinterest-838cd.firebaseapp.com",
    projectId: "pinterest-838cd",
    storageBucket: "pinterest-838cd.firebasestorage.app",
    messagingSenderId: "770794723608",
    appId: "1:770794723608:web:783166d73901e83eaaa66d",
    measurementId: "G-LM3V2F46R1",
  }

  // Initialize Firebase
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = getFirestore(app)

  // DOM element references
  const chatMessages = document.querySelector(".chat-messages")
  const messageInput = document.querySelector("#message-input")
  const sendButton = document.querySelector("#send-button")
  const backArrow = document.querySelector("#back-arrow")
  const receiverName = document.querySelector("#receiver-name")
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Global variables
  let currentUser = null
  let otherUser = null
  let unsubscribeMessages = null

  // Date formatting function
  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) {
      return ""
    }

    const date = timestamp.toDate()
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    const isToday = date.toDateString() === now.toDateString()
    const isYesterday = date.toDateString() === yesterday.toDateString()

    const timeStr = date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })

    if (isToday) {
      return timeStr
    }
    if (isYesterday) {
      return `Ayer ${timeStr}`
    }
    return `${date.toLocaleDateString("es-ES")} ${timeStr}`
  }

  const messaging = getMessaging(app)

  // Solicitar permiso para mostrar notificaciones en el navegador
  const getNotificationToken = async () => {
    try {
      const token = await getToken(messaging, { vapidKey: 'TU_VAPID_KEY' });
      if (token) {
        console.log("Token de notificación FCM:", token);
        // Guarda este token en tu base de datos asociado al usuario
        await updateDoc(doc(db, "users", currentUser.uid), { fcmToken: token });
      } else {
        console.log("No se obtuvo un token");
      }
    } catch (error) {
      console.error("Error al obtener el token de notificación:", error);
    }
  }

  const sendNotification = async (toUser) => {
    try {
      const userDoc = await getDoc(doc(db, "users", toUser.uid));
      const token = userDoc.data().fcmToken;

      if (token) {
        const message = {
          notification: {
            title: "Tienes un nuevo mensaje",
            body: "Abre la aplicación para ver el mensaje.",
          },
          token: token,
        };

        // Envía la notificación con Firebase Cloud Messaging
        await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `key=BD_Yj2Z23C_xy4p2IWcjPFT6WxxcIQFFbVwQVNJ80kRF5Lg-5YYloLDTGC9mRKkHS9HSJgW1Qbe4c8lGAnYB5NU`, // Usa tu clave del servidor de FCM
          },
          body: JSON.stringify(message),
        });
      }
    } catch (error) {
      console.error("Error al enviar la notificación:", error);
    }
  }

  // Llamar a esta función cuando se cargue la aplicación
  getNotificationToken();

  // Create message element function
  const createMessageElement = (messageData) => {
    const { texto, fecha, remitente, read } = messageData
    const isSender = remitente === currentUser.uid

    const messageDiv = document.createElement("div")
    messageDiv.className = `message ${isSender ? "sent" : "received"}`

    const contentDiv = document.createElement("div")
    contentDiv.className = "message-content"
    contentDiv.textContent = texto

    const infoDiv = document.createElement("div")
    infoDiv.className = "message-info"

    const timeSpan = document.createElement("span")
    timeSpan.className = "message-time"
    timeSpan.textContent = formatDate(fecha)

    if (isSender) {
      const statusSpan = document.createElement("span")
      statusSpan.className = "message-status"
      statusSpan.innerHTML = `
            <span class="material-icons ${read ? "read" : ""}">
                ${read ? "done_all" : "done"}
            </span>
        `
      infoDiv.appendChild(statusSpan)
    }

    infoDiv.appendChild(timeSpan)
    messageDiv.appendChild(contentDiv)
    messageDiv.appendChild(infoDiv)

    return messageDiv
  }

  // Scroll to bottom function
  const scrollToBottom = () => {
    chatMessages.scrollTop = chatMessages.scrollHeight
  }

  // Update header function
  const updateHeader = (isWaiting) => {
    const waitingContainer = document.getElementById("waiting-container");
    const waitingMessage = document.getElementById("waiting-message");

    if (isWaiting) {
        receiverName.innerHTML = 
            '<span class="waiting-text" style="color: white;">Esperando segundo usuario</span>';
        receiverName.classList.add("waiting-animation");

        if (waitingContainer) {
            waitingContainer.style.display = "block"; // Mostrar el contenedor de espera
        }

        if (waitingMessage) {
            waitingMessage.textContent = "Esperando segundo usuario";
        }
    } else {
        receiverName.textContent = otherUser?.displayName || "Chat";
        receiverName.classList.remove("waiting-animation");

        if (waitingContainer) {
            waitingContainer.style.display = "none"; // Ocultar el contenedor de espera
        }
    }
};

  // Mark messages as read function
  const markMessagesAsRead = async (messages) => {
    const batch = []
    messages.forEach((message) => {
      if (!message.read && message.remitente !== currentUser.uid) {
        const messageRef = doc(db, "messages", message.id)
        batch.push(updateDoc(messageRef, { read: true }))
      }
    })
    if (batch.length > 0) {
      await Promise.all(batch)
    }
  }

  // Send message function
  const sendMessage = async (text) => {
    if (!text.trim() || !otherUser) return;

    try {
        // Obtener el número actual de mensajes enviados por el usuario
        const userMessagesQuery = query(
            collection(db, "messages"),
            where("remitente", "==", currentUser.uid)
        );
        const userMessagesSnapshot = await getDocs(userMessagesQuery);

        // Determinar el número del próximo mensaje
        const nextMessageNumber = userMessagesSnapshot.size + 1;
        const messageId = `mensaje ${nextMessageNumber} de ${currentUser.displayName || "Usuario"}`;

        // Guardar el mensaje en la base de datos
        await addDoc(collection(db, "messages"), {
            texto: text.trim(),
            remitente: currentUser.uid,
            receptor: otherUser.uid,
            fecha: serverTimestamp(),
            read: false,
            messageId, // Almacenar el identificador del mensaje
        });

        messageInput.value = "";
        messageInput.focus();
        scrollToBottom();
    } catch (error) {
        console.error("Error al enviar mensaje:", error);
        alert("No se pudo enviar el mensaje. Por favor, intenta de nuevo.");
    }
};

  // Setup event listeners function
  const setupEventListeners = () => {
    sendButton.addEventListener("click", () => {
      sendMessage(messageInput.value)
    })

    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        sendMessage(messageInput.value)
      }
    })

    messageInput.addEventListener("input", () => {
      sendButton.disabled = !messageInput.value.trim()
    })

    backArrow.addEventListener("click", async () => {
      try {
        if (unsubscribeMessages) {
          unsubscribeMessages()
        }
        await signOut(auth)
        window.location.href = "https://es.pinterest.com/"
      } catch (error) {
        console.error("Error al cerrar sesión:", error)
      }
    })
  }

  // Initialize chat function
  const initializeChat = async (user) => {
    try {
      currentUser = user;

      const usersSnapshot = await getDocs(collection(db, "users"));
      const users = usersSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      otherUser = users.find((u) => u.uid !== currentUser.uid);

      if (!otherUser) {
        updateHeader(true);
        messageInput.disabled = true;
        sendButton.disabled = true;
        return;
      }

      updateHeader(false);
      messageInput.disabled = false;
      sendButton.disabled = true;

      const waitingContainer = document.getElementById("waiting-container");
      if (waitingContainer) {
        waitingContainer.style.display = "block"; // Mostrar contenedor de espera
      }

      const messagesQuery = query(
        collection(db, "messages"),
        where("remitente", "in", [currentUser.uid, otherUser.uid]),
        where("receptor", "in", [currentUser.uid, otherUser.uid]),
        orderBy("fecha", "asc")
      );

      unsubscribeMessages = onSnapshot(messagesQuery, async (snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
          messages.push({
            id: doc.id,
            ...doc.data(),
          });
        });
      
        // Verifica si hay nuevos mensajes
        if (messages.length === 0) {
          if (waitingContainer) {
            waitingContainer.style.display = "block";
          }
          chatMessages.innerHTML = ""; // Asegurarse de que no haya mensajes antiguos
        } else {
          if (waitingContainer) {
            waitingContainer.style.display = "none";
          }
          // Ordenar y mostrar mensajes
          chatMessages.innerHTML = "";
          messages.forEach((message) => {
            chatMessages.appendChild(createMessageElement(message));
          });
      
          // Marcar los mensajes como leídos
          await markMessagesAsRead(messages);
      
          // Si el último mensaje recibido no fue enviado por el usuario actual, notificar a la otra persona
          const lastMessage = messages[messages.length - 1];
          if (lastMessage.remitente !== currentUser.uid) {
            // Llamar a la función para enviar notificación
            await sendNotification(otherUser);
          }
      
          // Desplazar hacia abajo para ver el último mensaje
          scrollToBottom();
        }
      });
      

      setupEventListeners();
    } catch (error) {
      console.error("Error al inicializar chat:", error);
      receiverName.textContent = "Error al cargar el chat";
      messageInput.disabled = true;
      sendButton.disabled = true;
    }
  };

  // Check authentication state
  onAuthStateChanged(auth, (user) => {
    if (user) {
      initializeChat(user)
    } else {
      window.location.href = "register.html"
    }
  })
})
