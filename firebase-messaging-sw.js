importScripts('https://www.gstatic.com/firebasejs/3.5.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/3.5.2/firebase-messaging.js');

firebase.initializeApp({
    'messagingSenderId': '448358493027'
});

const messaging = firebase.messaging();

// Customize notification handler
messaging.setBackgroundMessageHandler(function(payload) {
    if (typeof payload.data.time != 'undefined') {
        var time = new Date(payload.data.time * 1000);
        var now = new Date();
        if (time < now) { // expired
            return null;
        }
        var diff = Math.round((time.getTime() - now.getTime()) / 1000);

        payload.data.body = 'Начало через ' + Math.round(diff / 60) + ' минут, в ' + time.getHours() + ':' + time.getMinutes();
    }

    payload.data.data = payload.data;

    return self.registration.showNotification(payload.data.title, payload.data);
});

self.addEventListener('notificationclick', function(event) {
    console.log(event);
    var target = event.notification.data.click_action || '/';
    event.notification.close();

    // This looks to see if the current is already open and focuses if it is
    event.waitUntil(clients.matchAll({
        type: 'window'
    }).then(function(clientList) {
        console.log(clientList);
        for (var i = 0; i < clientList.length; i++) {
            var client = clientList[i];
            if (client.url == target && 'focus' in client) {
                return client.focus();
            }
        }

        if (clients.openWindow) {
            return clients.openWindow(target);
        }
    }));
});
