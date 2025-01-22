importScripts('https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.17.2/firebase-messaging.js');

firebase.initializeApp({
    apiKey: "AIzaSyBtCQA5t7jtQaC3vQVPSjV2UnHpLozVFZE",
    authDomain: "pinterest-838cd.firebaseapp.com",
    projectId: "pinterest-838cd",
    storageBucket: "pinterest-838cd.firebasestorage.app",
    messagingSenderId: "770794723608",
    appId: "1:770794723608:web:783166d73901e83eaaa66d",
    measurementId: "G-LM3V2F46R1",
});

const messaging = firebase.messaging();

// Este evento se dispara cuando llega una notificación mientras la aplicación está en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('Mensaje recibido en segundo plano: ', payload);
  const notificationTitle = 'Nuevo mensaje';
  const notificationOptions = {
    body: payload.notification.body,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
