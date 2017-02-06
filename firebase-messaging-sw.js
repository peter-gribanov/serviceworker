// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/3.5.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/3.5.2/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
firebase.initializeApp({
    'messagingSenderId': '241818759138'
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
// const messaging = firebase.messaging();
//
// // Handle incoming messages. Called when:
// // - a message is received while the app has focus
// // - the user clicks on an app notification created by a sevice worker
// //   `messaging.setBackgroundMessageHandler` handler.
// messaging.onMessage(function(payload) {
//     // console.log("Message received. ", payload);
//     // ...
// });
