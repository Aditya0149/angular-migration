(function () {
    'use strict';

    angular.module('cloudlex.user', [])

        .config(['$stateProvider', function ($stateProvider) {
            //$routeProvider.when('/login', {
            //    templateUrl: 'app/user/user-login.html',
            //    controller: 'LoginCtrl as login'
            //});

            $stateProvider
                .state('login', {
                    url: '/login',
                    templateUrl: 'app/user/user-login.html',
                    controller: 'LoginCtrl as login',
                    onEnter: function () {
                        setTimeout(function () {
                            $('#loginmyCarousel').carousel({
                                interval: 4000,
                                cycle: true
                            });
                        }, 500);
                    },
                    params: {
                        userId: null,
                        password: null
                    }
                }).state('autologin', {
                    url: '/createfirm/login',
                    templateUrl: 'app/user/user-login.html',
                    controller: 'LoginCtrl as login',
                    params: {
                        userId: null,
                        password: null
                    }
                }).state('forgot-password', {
                    url: '/forgot-password',
                    templateUrl: 'app/user/activate-user/forgot-password.html',
                    controller: 'ForgotPasswordCtrl as frgtPswd'
                }).state('email-login', {
                    url: '/login/:token',
                    templateUrl: 'app/user/user-login.html',
                    controller: 'EmailLoginCtrl as login'
                }).state('terms', {
                    url: '/terms',
                    templateUrl: 'app/user/terms.html'

                }).state('create-firm', {
                    url: '/createfirm/:token',
                    templateUrl: 'app/user/create-firm/create-firm.html',
                    controller: 'createFirmCtrl as createfirm',
                    resolve: {
                        'isFirmLinkActive': ['$q', 'createFirmDatalayer', '$stateParams',
                            function ($q, createFirmDatalayer, $stateParams) {

                                var defer = $q.defer();

                                var params = {
                                    token: $stateParams.token
                                };


                                createFirmDatalayer.checkFirmLinkActive(params)
                                    .then(function (res) {
                                        console.log(res);
                                        if (res.data) {
                                            localStorage.setItem('toReferredIntakeLink', res.data.is_intake);
                                        }
                                        defer.resolve(res.data);
                                    }, function (e) {

                                    });
                                return defer.promise;
                            }]
                    }

                }).state('referral-token-expired', {
                    url: '/token-expired/:token',
                    templateUrl: 'app/user/create-firm/expired-token.html',
                    controller: 'referralExpTokenCtrl as referralExpTokenCtrl',
                })
                .state('activate-user', {
                    url: '/resetpassword/:uid/:timestamp/:hashed_pass',
                    templateUrl: 'app/user/activate-user/activate-user.html',
                    controller: 'ActivateUser as activate',
                    resolve: {
                        'isLinkActive': ['$q', 'activateUserDatalayer', '$stateParams',
                            function ($q, activateUserDatalayer, $stateParams) {

                                var defer = $q.defer();

                                var params = {
                                    uid: $stateParams.uid,
                                    hashed_pass: $stateParams.hashed_pass,
                                    timestamp: $stateParams.timestamp
                                };

                                activateUserDatalayer.isLinkActive(params)
                                    .then(function (res) {
                                        defer.resolve({ active: true });
                                    }, function (e) {
                                        switch (e.status) {
                                            case 412:
                                                defer.resolve({ expired: true });
                                                break;
                                            case 403:
                                                defer.resolve({ used: true });
                                                break;
                                            case 400:
                                                defer.resolve({ loggedIn: true });
                                                break;
                                        }
                                    });
                                return defer.promise;
                            }]
                    }
                });

        }]);

    angular
        .module('cloudlex.user')
        .factory('userSession', function () {
            var data = {};
            return {
                data: data,
                storeToken: storeToken,
                getToken: getToken
            };

            function storeToken(token) {
                localStorage.setItem("X-CSRF", token.trim());
                localStorage.setItem("loggedIn", true);
            }

            function getToken() {
                return localStorage.getItem("X-CSRF");
            }
        });

})();


