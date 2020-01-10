(function() {
    'use strict';

    angular
        .module('cloudlex.user')
        .factory('loginDatalayer', loginDatalayer);

    loginDatalayer.$inject = ["$http", "$q", "loginConstants", "clxKeepSessionAlive", "$rootScope", "$state", "masterData", "globalConstants", "launcherDatalayer", "$timeout"];

    function loginDatalayer($http, $q, loginConstants, keepSessionAlive, $rootScope, $state, masterData, globalConstants, launcherDatalayer, $timeout) {

        var loginFactory = {};

        loginFactory.authenticateUser = function(data, token) {
            if (angular.isDefined(token)) {
                data['ref_token'] = token;
            }

            var deferred = $q.defer();
            $http({
                url: loginConstants.RESTAPI.authenticate,
                method: "POST",
                data: $.param(data),
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                }
            }).success(function(response, status, headers, config) {
                deferred.resolve(response, status);
                setLogoutTime();

            }).error(function(ee, status, headers, config) {
                deferred.reject(status);
            });

            return deferred.promise;
        }


        loginFactory.validateCaptcha = function(data) {

            var deferred = $q.defer();
            $http({
                url: "https://www.google.com/recaptcha/api/siteverify",
                method: "post",
                data: $.param(data),
            }).success(function(response) {
                //console.log("i am called ",response)
                deferred.resolve(response);
            }).error(function(ee, status, headers, config) {
                deferred.resolve(ee);
            });

            return deferred.promise;

        }


        // login authenticate of java service API
        loginFactory.authenticateJavaService = function(data) {
            var deferred = $q.defer();
            $http.post(loginConstants.RESTAPI.javaLogin1, data)
                .then(function(response) {
                    deferred.resolve(response.data);
                }, function(error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }

        // user details java service call
        loginFactory.userDetails = function(token) {
            var deferred = $q.defer();
            var url = loginConstants.RESTAPI.userDetails;
            $http({
                url: url,
                method: "GET",
                headers: token, // Add params into headers
                withCredentials: true
            }).success(function(response) {
                deferred.resolve(response);
            }).error(function(ee, status, headers, config) {
                deferred.resolve(ee);
            });
            return deferred.promise;
        }

        // refresh token java service call
        loginFactory.refreshToken = function(token) {
            var deferred = $q.defer();
            $http.post(loginConstants.RESTAPI.refreshToken1, token)
                .then(function(response) {
                    deferred.resolve(response.data);
                }, function(error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        loginFactory.setLogoutTime = setLogoutTime;

        function setLogoutTime() {
            var logoutTime = globalConstants.autoLogoutTime;
            keepSessionAlive.setLogoutTime(logoutTime);
        }

        loginFactory.getToken = function(data) {
            var deferred = $q.defer();
            $http({
                url: loginConstants.RESTAPI.token,
                method: "GET",
                withCredentials: true
            }).success(function(response) {
                deferred.resolve(response);
            }).error(function(ee, status, headers, config) {
                deferred.reject(ee);
            });

            return deferred.promise;

        };

        loginFactory.logoutUser = function() {

            /**
             * Logout: For PHP Call 
             */
            // getting access token of java login user
            var token = {
                'access_token': localStorage.getItem('accessToken'),
                'refresh_token': localStorage.getItem('refreshToken')
            }

            var deferred = $q.defer();
            $http.post(loginConstants.RESTAPI.logoutUser, token)
                .then(function(response) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    deferred.resolve(response);
                }, function(error) {
                    deferred.reject(error);
                });

            return deferred.promise;

            /**
             * Logout: For JAVA Call 
             */
            // var deferred = $q.defer();
            // $http.post(loginConstants.RESTAPI.logoutUser1, token)
            //     .then(function (response) {
            //         localStorage.removeItem('accessToken');
            //         localStorage.removeItem('refreshToken');
            //         deferred.resolve(response);
            //     }, function (error) {
            //         deferred.reject(error);
            //     });

            // return deferred.promise;

        };

        loginFactory.navigateUserToLanding = function(fromFirmSelection) {
            if (fromFirmSelection) {
                $rootScope.display.sideNav = false;
                $timeout(function() {
                    $rootScope.display.sideNav = true;
                }, 1);
            }
            var data = localStorage.getItem('suData');
            data = JSON.parse(data);
            var RferredMatterLink = localStorage.getItem('fromReferredMatterLink');
            var role = masterData.getUserRole();
            localStorage.setItem('userRole', role.role);
            localStorage.setItem('fId',role.firm_id);

            if ((role.role == globalConstants.adminrole) && (role.firm_id === null)) {
                $state.go('firms', { 'credentials': data });
            } else if (utils.isNotEmptyVal(RferredMatterLink)) {
                launcherDatalayer.getAppAccess().then(function(response) {
                    $rootScope.isDigiArchivalSub = utils.checkIfAppActive(response.user_permission, "DA");
                    $rootScope.isReferalActive = utils.checkIfAppActive(response.user_permission, "RE");
                    $rootScope.isIntakeActive = utils.checkIfAppActive(response.user_permission, "IM");
                    $rootScope.isExpenseActive = utils.checkIfAppActive(response.user_permission, "EM");

                    $rootScope.isDigiArchivalSubUI = utils.checkIfAppActive(response.user_permission, "DA");
                    $rootScope.isReferalActiveUI = utils.checkIfAppActive(response.user_permission, "RE");
                    $rootScope.isIntakeActiveUI = utils.checkIfAppActive(response.user_permission, "IM");
                    $rootScope.isExpenseActiveUI = utils.checkIfAppActive(response.user_permission, "EM");

                    localStorage.setItem("isDigiArchivalSub", $rootScope.isDigiArchivalSub);
                    localStorage.setItem("isReferalActive", $rootScope.isReferalActive);
                    localStorage.setItem("isIntakeActive", $rootScope.isIntakeActive);
                    localStorage.setItem("isExpenseActive", $rootScope.isExpenseActive);

                    $rootScope.showWaitMessage = false;
                    $rootScope.waitMessage = "";
                    if ($rootScope.isReferalActive == 0) {
                        var launchpad = JSON.parse(localStorage.getItem('launchpadSetting'));

                        if (launchpad && launchpad.enabled == 1) {
                            $state.go('launcher');
                        } else {
                            $state.go('dashboard.analytics');
                        }
                    } else {
                        var stateToGo = localStorage.getItem('gotoState');
                        $state.go(stateToGo);
                    }
                }, function() {
                    var stateToGo = localStorage.getItem('gotoState');
                    $state.go(stateToGo);
                });
            } else {
                var launchpad = JSON.parse(localStorage.getItem('launchpadSetting'));

                if (launchpad && launchpad.enabled == 1) {

                    launcherDatalayer.getAppAccess().then(function(response) {
                        $rootScope.isDigiArchivalSub = utils.checkIfAppActive(response.user_permission, "DA");
                        $rootScope.isReferalActive = utils.checkIfAppActive(response.user_permission, "RE");
                        $rootScope.isIntakeActive = utils.checkIfAppActive(response.user_permission, "IM");
                        $rootScope.isExpenseActive = utils.checkIfAppActive(response.user_permission, "EM");

                        localStorage.setItem("isDigiArchivalSub", $rootScope.isDigiArchivalSub);
                        localStorage.setItem("isReferalActive", $rootScope.isReferalActive);
                        localStorage.setItem("isIntakeActive", $rootScope.isIntakeActive);
                        localStorage.setItem("isExpenseActive", $rootScope.isExpenseActive);

                        if ($rootScope.isDigiArchivalSub == 0) {
                            utils.removeDefaultApp("DA");
                        }
                        if ($rootScope.isReferalActive == 0) {
                            utils.removeDefaultApp("RE");
                        }
                        if ($rootScope.isIntakeActive == 0) {
                            utils.removeDefaultApp("IM");
                        }
                        if ($rootScope.isExpenseActive == 0) {
                            utils.removeDefaultApp("EM");
                        }
                        $rootScope.showWaitMessage = false;
                        $rootScope.waitMessage = "";
                        var name = localStorage.getItem('user_email');
                        //Check if Cookies & goto default application
                        if (document.cookie.split(';').filter(function(item) {
                                var cookiesValue = item;
                                return item.indexOf(name + '@default_app=') >= 0
                            }).length) {
                            if (document.cookie.split(';').filter(function(item) {
                                    return item.indexOf(name + '@default_app=MM') >= 0
                                }).length) {
                                $state.go('dashboard.analytics');
                            } else if (document.cookie.split(';').filter(function(item) {
                                    return item.indexOf(name + '@default_app=IM') >= 0
                                }).length) {
                                $state.go('intakedashboard.analytics');
                            } else if (document.cookie.split(';').filter(function(item) {
                                    return item.indexOf(name + '@default_app=RE') >= 0
                                }).length) {
                                $state.go('referred-matters');
                            } else if (document.cookie.split(';').filter(function(item) {
                                    return item.indexOf(name + '@default_app=AR') >= 0
                                }).length) {
                                $state.go('archival');
                            } else {
                                $state.go('launcher');
                            }

                        } else {
                            $state.go('launcher');
                        }
                    }, function() {
                        $state.go('launcher');
                    });

                } else {
                    $state.go('dashboard.analytics');
                }


            }
        };

        return loginFactory;
    }
})();