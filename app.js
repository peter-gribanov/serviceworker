
console.log('start');


this.onpush = function(event) {
  console.log(event.data);
  // From here we can write the data to IndexedDB, send it to any open
  // windows, display a notification, etc.
}


var isPushEnabled = false;
var useNotifications = false;

if (!('serviceWorker' in navigator)) {
    console.warn('Service workers aren\'t supported in this browser.');
} else {
    navigator.serviceWorker.register('/serviceworker/sw.js').then(function (reg) {
        if (reg.installing) {
            console.log('Service worker installing');
        } else if(reg.waiting) {
            console.log('Service worker installed');
        } else if(reg.active) {
            console.log('Service worker active');
        }

        reg.pushManager.subscribe({userVisibleOnly: true}).then(function (pushSubscription) {
            console.log(pushSubscription.subscriptionId);
            console.log(pushSubscription.endpoint);
            // The push subscription details needed by the application
            // server are now available, and can be sent to it using,
            // for example, an XMLHttpRequest.
        }).catch(function(error) {
            // During development it often helps to log errors to the
            // console. In a production environment it might make sense to
            // also report information about errors back to the
            // application server.
            console.log(error);
        });

//         initialiseState(reg);
    });
}

// Once the service worker is registered set the initial state
function initialiseState(reg) {
    // Are Notifications supported in the service worker?
    if (!(reg.showNotification)) {
        console.log('Notifications aren\'t supported on service workers.');
        useNotifications = false;
    } else {
        useNotifications = true;
    }

    // Check the current Notification permission.
    // If its denied, it's a permanent block until the
    // user changes the permission
    if (Notification.permission === 'denied') {
        console.log('The user has blocked notifications.');
        return;
    }

    // Check if push messaging is supported
    if (!('PushManager' in window)) {
        console.log('Push messaging isn\'t supported.');
        return;
    }

    // We need the service worker registration to check for a subscription
    navigator.serviceWorker.ready.then(function(reg) {
        // Do we already have a push message subscription?
        reg.pushManager.getSubscription()
            .then(function(subscription) {
                // Enable any UI which subscribes / unsubscribes from
                // push messages.
                if (!subscription) {
                    console.log('Not yet subscribed to Push');
                    // We aren't subscribed to push, so set UI
                    // to allow the user to enable push
                    reg.pushManager.subscribe();
                    return;
                }
                // Set your UI to show they have subscribed for
                // push messages
                isPushEnabled = true;
                // initialize status, which includes setting UI elements for subscribed status
                // and updating Subscribers list via push
                console.log(subscription.toJSON());
                var endpoint = subscription.endpoint;
                var key = subscription.getKey('p256dh');
                console.log(key);
                // updateStatus(endpoint, key, 'init');
            })
            .catch(function(err) {
                console.log('Error during getSubscription()', err);
            });
        // set up a message channel to communicate with the SW
        var channel = new MessageChannel();
        channel.port1.onmessage = function(e) {
            console.log(e);
            // handleChannelMessage(e.data);
        };
        mySW = reg.active;
        mySW.postMessage('hello', [channel.port2]);
    });
}
