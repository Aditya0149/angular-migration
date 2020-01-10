(function () {

    angular
        .module('cloudlex.launcher')
        .factory('launcherDatalayer', launcherDatalayer);


    launcherDatalayer.$inject = ['$http', '$q', 'globalConstants'];
    function launcherDatalayer($http, $q, globalConstants) {

        var mattercount = globalConstants.webServiceBase + "matter/matter_count.json";
        var firmAcitivities = globalConstants.webServiceBase + "Matter-Manager/v1/firm/fetch-firm-activities";
        var appAccess = globalConstants.javaWebServiceBaseV4 + "launchpad-accessmanagement/user-permission/app";



        return {
            getmattercount: getmattercount,
            getRecentActivities: getRecentActivities,
            getAppAccess: getAppAccess
        }

        function getCall(url) {
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: url,
                method: "GET",
                headers: token,
            })
                .then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        };

        function getmattercount() {
            var deferred = $q.defer();
            var url = mattercount;
            $http.get(url)
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        function getRecentActivities() {
            return getCall(firmAcitivities);
        }

        function getAppAccess() {
            return getCall(appAccess);
        }

    }

})();

(function () {

    angular
        .module('cloudlex.launcher')
        .factory('pushNotificatioHelper', pushNotificatioHelper);


    pushNotificatioHelper.$inject = ['$http', '$q', 'globalConstants'];
    function pushNotificatioHelper($http, $q, globalConstants) {

        return {
           // pushNotificationInit: pushNotificationInit,
            requestBrowserPermission: requestBrowserPermission
        }

        function pushNotificationInit() {
            var ua = window.navigator.userAgent,
                safariTxt = ua.indexOf("Safari"),
                chrome = ua.indexOf("Chrome"),
                firefox = ua.indexOf("Firefox"),
                version = ua.substring(0, safariTxt).substring(ua.substring(0, safariTxt).lastIndexOf("/") + 1);
            if (chrome == -1 && firefox == -1 && safariTxt > 0) {
                if (parseInt(version, 10) >= 7) {
                    safariIniti();
                } else {
                    console.log("Safari unsupported version detected.");
                }
            }
            else {
                requestBrowserPermission();
            }
        }

        // For safari
        var domain = "https://qa.app.cloudlex.com/";
        function requestPermissions() {
            window.safari.pushNotification.requestPermission(globalConstants.javaWebServiceBaseV4 + 'notification/push_web_notification', "https://qa.app.cloudlex.com/", {}, function (subscription) {
                console.log('subscription safari is ', subscription);
                if (c.permission === 'granted') {
                    console.log('per granted... and sub is ', subscription);
                    subscribe(subscription);
                }
                else if (c.permission === 'denied') {
                    // TODO:
                    console.log('per denied');
                }
            }, function error(err) {
                console.log('safari error while req permissions', err);
            });
        }

        // For safari
        function safariIniti() {
            console.log('inside safari init...');
            var pResult = window.safari.pushNotification.permission("https://qa.app.cloudlex.com/");
            console.log('pResult -> ', pResult);
            if (pResult.permission === 'default') {
                //request permission
                console.log('perm default');
                requestPermissions();
            } else if (pResult.permission === 'granted') {
                console.log("Permission for " + "https://qa.app.cloudlex.com/" + " is " + pResult.permission);
                var token = pResult.deviceToken;
                // Show subscription for debug
                window.prompt('Subscription details:', token);
                subscribe(subscription);
            } else if (pResult.permission === 'denied') {
                console.log('perm denied');
                alert("Permission for " + "https://qa.app.cloudlex.com/" + " is " + pResult.permission);
            }
        }




        function requestBrowserPermission() {
            Notification.requestPermission(function (status) {
                if (Notification.permission !== status) {
                    Notification.permission = status;
                }
                if (status == 'granted') doNotify();
                else console.log('status - ', status);
                //else alert("Please allow browser permissions for this site");
            });
        }
        function doNotify() {
            setTimeout(function () {
                if (navigator.serviceWorker) {
                    try {
                        send();
                    } catch (error) {
                        console.log("error is -> ", error);
                    }
                }
            }, 5000);
        }


        function send() {
            var publicVapidKey = 'BBYCxwATP2vVgw7mMPHJfT6bZrJP2iUV7OP_oxHzEcNFenrX66D8G34CdEmVULNg4WJXfjkeyT0AT9LwavpN8M4=';
            navigator.serviceWorker.register('client-sw.js?v=12345').then(function (register) {
                register.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
                }).then(function (subscription) {
                    console.log('pushManager Registered ', subscription);
                    console.log("subscribe...");
                    subscribe(subscription).then(
                        function (data) {
                            console.log('subscription response from server -> ', data)
                        }, function (err) {
                            console.log('subscription error from server -> ', err);
                        }
                    )
                }, function (error) {
                    console.log("error -> ", error);
                    return false;
                })
            }, function (err) {
                console.log("serviceWorker error -> ", err);
            });

        }
        function urlBase64ToUint8Array(base64String) {
            var padding = '='.repeat((4 - base64String.length % 4) % 4);
            var base64 = (base64String + padding)
                .replace(/-/g, '+')
                .replace(/_/g, '/');

            var rawData = window.atob(base64);
            var outputArray = new Uint8Array(rawData.length);

            for (var i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
        }

        function subscribe(data) {
            var url = globalConstants.javaWebServiceBaseV4 + 'notification/push_web_notification';
            var applicationServerKey = btoa(String.fromCharCode.apply(null, new Uint8Array(data.options.applicationServerKey)));
            //var publicVapidKey = btoa(String.fromCharCode.apply(null, new Uint8Array(publicVapidKey)));
            var key = btoa(String.fromCharCode.apply(null, new Uint8Array(data.getKey('p256dh'))));
            var auth = btoa(String.fromCharCode.apply(null, new Uint8Array(data.getKey('auth'))));
            console.log("key ", key);
            console.log("auth ", auth);
            // var token = {
            //     //'Content-type': 'application/json;charset=UTF-8',
            //     'Authorization': "Bearer " + localStorage.getItem('accessToken')

            // }
            var deferred = $q.defer();
            //var url = serviceBase.ADD_EVENT1;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "POST",
                headers: token,// Add params into headers
                data: { public_key: key, auth: auth, end_point: data.endpoint }
            }).then(function (response) {
                deferred.resolve(response.data);
            }, function (response) {
                deferred.reject(response.data);
            });
            return deferred.promise;

        }
    }
})();