(function () {
    'use strict';

    angular.module('clxKeepSessionAlive', []);

    angular.module('clxKeepSessionAlive')
        .run(['$templateCache', function ($templateCache) {
            'use strict';

            $templateCache.put('keep-alive.html',
                "<div style='position:absolute;top:0;right:0'>" +
                "<h1 >keep me alive</h1>" +
                "<div class='pull-right'><button data-ng-click='$keepAlive()'>ok</button></div>" +
                "</div>"
            );

        }]);


    angular.module('clxKeepSessionAlive')
        .provider('clxKeepSessionAlive', keepSessionAlive);

    function keepSessionAlive() {

        var keepSessionAliveUrl = '', getSessionStatusUrl = '';
        var logoutTime;
        var alertLogoutTime;
        var logoutUrl = '';


        this.setSessionAliveUrl = function (url) {
            keepSessionAliveUrl = url;
        }

        this.setGetSessionStatusUrl = function (url) {
            getSessionStatusUrl = url;
        };

        this.setLogoutUrl = function (url) {
            logoutUrl = url;
        };

        this.setLogoutTime = function (time) {
            //time = time <= 5 ? 5 : parseInt(time);
            logoutTime = time;
            alertLogoutTime = parseInt(3 / 4 * logoutTime);
        };

        this.$get = keepSessionAliveHelper;

        keepSessionAliveHelper.$inject = ['$rootScope', '$injector', '$interval', '$templateCache'];

        function keepSessionAliveHelper($rootscope, $injector, $interval, $templateCache) {

            var timeElapsed = 0;
            var timer;
            var templateEl;
            var helper = {};

            return {
                resetTimer: resetTimer,
                setLogoutTime: setLogoutTime
            };

            function resetTimer() {
                $interval.cancel(timer);
                timeElapsed = 0;
                startTimer();
            };

            function setLogoutTime(time) {
                time = parseInt(time);
                logoutTime = time / 60;
                logoutTime = logoutTime + 1;
            }

            function startTimer() {
                timer = $interval(function () {
                    var $state = $injector.get('$state');
                    var notificationService = $injector.get('notification-service');

                    timeElapsed += 1;

                    if (logoutTime <= timeElapsed) {
                        checkSession()
                            .then(function (res) {
                                var isAlive = res.data[0];
                                if (isAlive) {
                                    resetTimer();
                                } else {
                                    notificationService.success('User session timed out.');
                                    $interval.cancel(timer);
                                    localStorage.clear();
                                    sessionStorage.clear();
                                    $state.go('login');
                                }
                            });
                    }
                }, 60000)
            }

            function checkSession() {
                var $http = $injector.get('$http');
                return $http.get(getSessionStatusUrl);
            }

            function logout() {
                var $http = $injector.get('$http');
                var $state = $injector.get('$state');

                var notificationService = $injector.get('notification-service');

                $http.post(logoutUrl).then(function (response) {
                    var notificationService = $injector.get('notification-service');
                    notificationService.success('You have logged out from the system.');
                    localStorage.clear();
                    sessionStorage.clear();
                    $state.go('login');
                }, function (error) {
                    if (error == 406) {
                    } else if (error == 401) {
                        localStorage.clear();
                        sessionStorage.clear();
                        $state.go('login');
                    }
                });
            }

            function fireAlert() {

                var scope = $rootscope.$new();
                scope.$keepAlive = keepAlive;

                var http = $injector.get('$http');
                http.get('keep-alive.html', { cache: $templateCache })
                    .success(function (template) {
                        var $compile = $injector.get('$compile');
                        templateEl = $compile(template)(scope);
                        angular.element(document.body).append(templateEl);
                    });
            }

            function keepAlive() {
                var $http = $injector.get('$http');
                resetTimer();

                var el = angular.element(templateEl);
                el.remove();

                $http.get(keepSessionAliveUrl);
            };

        }

    }

})();




//if (logoutTime === timeElapsed) {
//    var lastRequestTime = parseInt(localStorage.getItem('lastRequestTime'));
//    lastRequestTime = moment(lastRequestTime);
//    var now = moment();

//    var duration = moment.duration(now.diff(lastRequestTime)).asMinutes();

//    if (duration >= timeElapsed) {
//        $interval.cancel(timer);
//        logout();
//    } else {
//        resetTimer();
//    }
//}