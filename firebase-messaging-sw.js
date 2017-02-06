importScripts('https://www.gstatic.com/firebasejs/3.5.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/3.5.2/firebase-messaging.js');

firebase.initializeApp({
    'messagingSenderId': '241818759138'
});

const messaging = firebase.messaging();

// Customize notification handler
messaging.setBackgroundMessageHandler(function(payload) {
    console.log(payload.data);

    return self.registration.showNotification(payload.data.title, payload.data);
});
