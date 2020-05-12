firebase.initializeApp({
    messagingSenderId: '448358493027'
});


var bt_register = $('#register');
var bt_delete = $('#delete');
var token = $('#token');
var form = $('#notification');
var massage_id = $('#massage_id');
var massage_row = $('#massage_row');

var info = $('#info');
var info_message = $('#info-message');

var alert = $('#alert');
var alert_message = $('#alert-message');

var input_body = $('#body');
var timerId = setInterval(setNotificationDemoBody, 10000);

function setNotificationDemoBody() {
    if (input_body.val().search(/^It's found today at \d\d:\d\d$/i) !== -1) {
        var now = new Date();
        input_body.val('It\'s found today at ' + now.getHours() + ':' + addZero(now.getMinutes()));
    } else {
        clearInterval(timerId);
    }
}

function addZero(i) {
    return i > 9 ? i : '0' + i;
}

setNotificationDemoBody();
resetUI();

if (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'localStorage' in window &&
    'fetch' in window &&
    'postMessage' in window
) {
    var messaging = firebase.messaging();

    // already granted
    if (Notification.permission === 'granted') {
        getToken();
    }

    // get permission on subscribe only once
    bt_register.on('click', function() {
        getToken();
    });

    bt_delete.on('click', function() {
        // Delete Instance ID token.
        messaging.getToken()
            .then(function(currentToken) {
                messaging.deleteToken(currentToken)
                    .then(function() {
                        console.log('Token deleted');
                        setTokenSentToServer(false);
                        // Once token is deleted update UI.
                        resetUI();
                    })
                    .catch(function(error) {
                        showError('Unable to delete token', error);
                    });
            })
            .catch(function(error) {
                showError('Error retrieving Instance ID token', error);
            });
    });

    form.on('submit', function(event) {
        event.preventDefault();

        var notification = {};
        form.find('input').each(function () {
            var input = $(this);
            notification[input.attr('name')] = input.val();
        });

        sendNotification(notification);
    });

    // handle catch the notification on current page
    messaging.onMessage(function(payload) {
        console.log('Message received', payload);
        info.show();
        info_message
            .text('')
            .append('<strong>'+payload.data.title+'</strong>')
            .append('<em>'+payload.data.body+'</em>')
        ;

        // register fake ServiceWorker for show notification on mobile devices
        navigator.serviceWorker.register('/serviceworker/firebase-messaging-sw.js');
        Notification.requestPermission(function(permission) {
            if (permission === 'granted') {
                navigator.serviceWorker.ready.then(function(registration) {
                  // Copy data object to get parameters in the click handler
                  payload.data.data = JSON.parse(JSON.stringify(payload.data));

                  registration.showNotification(payload.data.title, payload.data);
                }).catch(function(error) {
                    // registration failed :(
                    showError('ServiceWorker registration failed', error);
                });
            }
        });
    });

    // Callback fired if Instance ID token is updated.
    messaging.onTokenRefresh(function() {
        messaging.getToken()
            .then(function(refreshedToken) {
                console.log('Token refreshed');
                // Send Instance ID token to app server.
                sendTokenToServer(refreshedToken);
                updateUIForPushEnabled(refreshedToken);
            })
            .catch(function(error) {
                showError('Unable to retrieve refreshed token', error);
            });
    });

} else {
    if (!('Notification' in window)) {
        showError('Notification not supported');
    } else if (!('serviceWorker' in navigator)) {
        showError('ServiceWorker not supported');
    } else if (!('localStorage' in window)) {
        showError('LocalStorage not supported');
    } else if (!('fetch' in window)) {
        showError('fetch not supported');
    } else if (!('postMessage' in window)) {
        showError('postMessage not supported');
    }

    console.warn('This browser does not support desktop notification.');
    console.log('Is HTTPS', window.location.protocol === 'https:');
    console.log('Support Notification', 'Notification' in window);
    console.log('Support ServiceWorker', 'serviceWorker' in navigator);
    console.log('Support LocalStorage', 'localStorage' in window);
    console.log('Support fetch', 'fetch' in window);
    console.log('Support postMessage', 'postMessage' in window);

    updateUIForPushPermissionRequired();
}


function getToken() {
    messaging.requestPermission()
        .then(function() {
            // Get Instance ID token. Initially this makes a network call, once retrieved
            // subsequent calls to getToken will return from cache.
            messaging.getToken()
                .then(function(currentToken) {

                    if (currentToken) {
                        sendTokenToServer(currentToken);
                        updateUIForPushEnabled(currentToken);
                    } else {
                        showError('No Instance ID token available. Request permission to generate one');
                        updateUIForPushPermissionRequired();
                        setTokenSentToServer(false);
                    }
                })
                .catch(function(error) {
                    showError('An error occurred while retrieving token', error);
                    updateUIForPushPermissionRequired();
                    setTokenSentToServer(false);
                });
        })
        .catch(function(error) {
            showError('Unable to get permission to notify', error);
        });
}


function sendNotification(notification) {
    var key = 'AAAAaGQ_q2M:APA91bGCEOduj8HM6gP24w2LEnesqM2zkL_qx2PJUSBjjeGSdJhCrDoJf_WbT7wpQZrynHlESAoZ1VHX9Nro6W_tqpJ3Aw-A292SVe_4Ho7tJQCQxSezDCoJsnqXjoaouMYIwr34vZTs';

    console.log('Send notification', notification);

    // hide last notification data
    info.hide();
    massage_row.hide();

    messaging.getToken()
        .then(function(currentToken) {
            fetch('https://fcm.googleapis.com/fcm/send', {
                method: 'POST',
                headers: {
                    'Authorization': 'key=' + key,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    // Firebase loses 'image' from the notification.
                    // And you must see this: https://github.com/firebase/quickstart-js/issues/71
                    data: notification,
                    to: currentToken
                })
            }).then(function(response) {
                return response.json();
            }).then(function(json) {
                console.log('Response', json);

                if (json.success === 1) {
                    massage_row.show();
                    massage_id.text(json.results[0].message_id);
                } else {
                    massage_row.hide();
                    massage_id.text(json.results[0].error);
                }
            }).catch(function(error) {
                showError(error);
            });
        })
        .catch(function(error) {
            showError('Error retrieving Instance ID token', error);
        });
}

// Send the Instance ID token your application server, so that it can:
// - send messages back to this app
// - subscribe/unsubscribe the token from topics
function sendTokenToServer(currentToken) {
    if (!isTokenSentToServer(currentToken)) {
        console.log('Sending token to server...');
        // send current token to server
        //$.post(url, {token: currentToken});
        setTokenSentToServer(currentToken);
    } else {
        console.log('Token already sent to server so won\'t send it again unless it changes');
    }
}

function isTokenSentToServer(currentToken) {
    return window.localStorage.getItem('sentFirebaseMessagingToken') === currentToken;
}

function setTokenSentToServer(currentToken) {
    if (currentToken) {
        window.localStorage.setItem('sentFirebaseMessagingToken', currentToken);
    } else {
        window.localStorage.removeItem('sentFirebaseMessagingToken');
    }
}

function updateUIForPushEnabled(currentToken) {
    console.log(currentToken);
    token.text(currentToken);
    bt_register.hide();
    bt_delete.show();
    form.show();
}

function resetUI() {
    token.text('');
    bt_register.show();
    bt_delete.hide();
    form.hide();
    massage_row.hide();
    info.hide();
}

function updateUIForPushPermissionRequired() {
    bt_register.attr('disabled', 'disabled');
    resetUI();
}

function showError(error, error_data) {
    if (typeof error_data !== "undefined") {
        console.error(error, error_data);
    } else {
        console.error(error);
    }

    alert.show();
    alert_message.html(error);
}
