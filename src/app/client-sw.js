var baseUrl = "https://cloudlexui-demo.azurewebsites.net/#/";
// setting base url from contants.js
self.addEventListener('message', function (event) {
  // if (event.data.baseUrl) {
  //   baseUrl = event.data.baseUrl;
  //   console.log('base url set -> ',baseUrl);
  // }
});

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim());
});


self.addEventListener('push', function (event) {
  var data = event.data.json();
  var messsageobj = JSON.parse(data.message);
  var subscriptionOptions = {
    icon: 'styles/images/logo.png',
    vibrate: [100, 50, 100],
    tag: 'tag'+Date.now() // tags should be different for every notification
  };
  subscriptionOptions.title = messsageobj.notification.title;
  subscriptionOptions.body = messsageobj.notification.body;
  var promisechain = self.registration.showNotification(subscriptionOptions.title, {
      body: subscriptionOptions.body,
      icon: subscriptionOptions.icon,
      tag: subscriptionOptions.tag,
      vibrate: subscriptionOptions.vibrate,
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
      
    });
  event.waitUntil(promisechain);
});


self.addEventListener('notificationclick',function (event) {
    var url = baseUrl + "notifications";
    event.notification.close();
    event.waitUntil(clients.matchAll({
      type: "window"
    }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url == url) {
            return client.focus();  
        }
      }
      if (clients.openWindow) {
          return clients.openWindow(url);
      }
    }));
});
