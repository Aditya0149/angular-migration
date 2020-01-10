(function (angular) {

    'use strict';

    angular
        .module('cloudlex')
        .factory('routeManager', routeManager);

    routeManager.$inject = ['$window', '$rootScope', 'masterData', '$state',
        '$http', 'globalConstants', '$modalStack', 'userRole'];
    function routeManager($window, $rootScope, masterData, $state,
        $http, globalConstants, $modalStack, userRoleFromValue) {

        var prevState,
            prevStateParams,
            currentState,
            breadcrums = [];

        return {
            stateChangeStart: stateChangeStart,
            onStateChangeSuccess: onStateChangeSuccess,
            getPreviousState: getPreviousState,
            goToPrevState: goToPrevState,
            getCurrentState: getCurrentState,
            addToBreadcrum: addToBreadcrum,
            getBreadcrums: getBreadcrums,
            setBreadcrum: setBreadcrum
        };

        function checkIfLauncherActive() {
            var launchpad = JSON.parse(localStorage.getItem('launchpadSetting'));
            if (launchpad && launchpad.enabled != 1) {
                $rootScope.onLauncher = false;
                $rootScope.onMatter = true;
                $rootScope.onIntake = false;
                $rootScope.onReferral = false;
                $rootScope.onArchival = false;
                $rootScope.onMarkerplace = false;
                $rootScope.onContactManager = false;
                $rootScope.onExpense = false;
                $rootScope.onReferralPrg = false;
            }
        }

        function gotoMM(e) {
            var launchpad = JSON.parse(localStorage.getItem('launchpadSetting'));
            if (launchpad && launchpad.enabled != 1) {
                $rootScope.onLauncher = false;
                $rootScope.onMatter = true;
                $rootScope.onIntake = false;
                $rootScope.onReferral = false;
                $rootScope.onArchival = false;
                $rootScope.onMarkerplace = false;
                $rootScope.onContactManager = false;
                $rootScope.onExpense = false;
                $rootScope.onReferralPrg = false;
                e.preventDefault();
                $state.go('dashboard.analytics');
            }

        }

        function gotoDefaultState() {
            var launchpad = JSON.parse(localStorage.getItem('launchpadSetting'));
            if (launchpad && launchpad.enabled != 1) {
                $state.go('dashboard.analytics');
            } else {
                $state.go('launcher');
            }
        }

        function stateChangeStart(e, toState, toParams, fromState, fromParams) {

            if (typeof ($rootScope.isIntakeActive) == 'undefined') {
                $rootScope.isDigiArchivalSub = localStorage.getItem("isDigiArchivalSub");
                $rootScope.isReferalActive = localStorage.getItem("isReferalActive");
                $rootScope.isIntakeActive = localStorage.getItem("isIntakeActive");
                $rootScope.isSmsActive = localStorage.getItem("isSmsActive");
            }

            if (toState.url.indexOf("/notifications") > -1 && toState.name == "allnotifications"){

            }else{
                $rootScope.onNotifications = false;
            }

            if (toState.name.indexOf("settings.profile") > -1 ||
                toState.name.indexOf("settings.practice") > -1 ||
                toState.name.indexOf("settings.userManagement") > -1 ||
                toState.name.indexOf("settings.subscription") > -1 ||
                toState.name.indexOf("settings.configuration") > -1) {
                $rootScope.onLauncher = false;
                $rootScope.onMatter = false;
                $rootScope.onIntake = false;
                $rootScope.onReferral = false;
                $rootScope.onArchival = false;
                $rootScope.onMarkerplace = false;
                $rootScope.onContactManager = false;
                $rootScope.onExpense = false;
                $rootScope.onReferralPrg = false;
                checkIfLauncherActive();
            } else {
                if (toState.url.indexOf("/intake/") > -1 || toState.url.indexOf("/intake-documents/") > -1 || toState.name.indexOf("intakedashboard.analytics") > -1) {
                    if ($rootScope.isIntakeActive == 0 && toState.url.indexOf("application-details/intake-manager") == -1 && toState.url.indexOf("/intake/referred-intake") == -1) {
                        $rootScope.logout();
                        return;
                    }
                    $rootScope.onLauncher = false;
                    $rootScope.onMatter = false;
                    $rootScope.onIntake = true;
                    $rootScope.onReferral = false;
                    $rootScope.onArchival = false;
                    $rootScope.onMarkerplace = false;
                    $rootScope.onContactManager = false;
                    $rootScope.onExpense = false;
                    $rootScope.onReferralPrg = false;
                    gotoMM(e);
                } else if (toState.url.indexOf("/launcher") > -1) {
                    $rootScope.onLauncher = true;
                    $rootScope.onMatter = false;
                    $rootScope.onIntake = false;
                    $rootScope.onReferral = false;
                    $rootScope.onArchival = false;
                    $rootScope.onMarkerplace = false;
                    $rootScope.onContactManager = false;
                    $rootScope.onExpense = false;
                    $rootScope.onReferralPrg = false;
                    gotoMM(e);
                } else if (toState.name == "marketplace.applications" || toState.url.indexOf("/marketplace") > -1 || toState.url.indexOf("/application-details/") > -1 || toState.url.indexOf("/services") > -1 || toState.name == "marketplace.upcoming" || toState.url.indexOf("/lexvia-service-details-up/") > -1) {
                    $rootScope.onLauncher = false;
                    $rootScope.onMatter = false;
                    $rootScope.onIntake = false;
                    $rootScope.onReferral = false;
                    $rootScope.onArchival = false;
                    $rootScope.onMarkerplace = true;
                    $rootScope.onContactManager = false;
                    $rootScope.onReferralPrg = false;
                    checkIfLauncherActive();
                } else if (toState.url.indexOf("/referred-matters") > -1) {
                    if ($rootScope.isReferalActive == 0) {
                        $rootScope.logout();
                        return;
                    }
                    $rootScope.onLauncher = false;
                    $rootScope.onMatter = false;
                    $rootScope.onIntake = false;
                    $rootScope.onReferral = true;
                    $rootScope.onArchival = false;
                    $rootScope.onMarkerplace = false;
                    $rootScope.onContactManager = false;
                    $rootScope.onExpense = false; 
                    $rootScope.onReferralPrg = false;
                    checkIfLauncherActive();
                } else if (toState.url.indexOf("/referral-program") > -1) {
                    $rootScope.onLauncher = false;
                    $rootScope.onMatter = false;
                    $rootScope.onIntake = false;
                    $rootScope.onReferral = true;
                    $rootScope.onArchival = false;
                    $rootScope.onMarkerplace = false;
                    $rootScope.onContactManager = false;
                    $rootScope.onExpense = false; 
                    $rootScope.onReferralPrg = true;
                    checkIfLauncherActive();
                }else if (toState.url.indexOf("/archival") > -1) {
                    if ($rootScope.isDigiArchivalSub == 0) {
                        $rootScope.logout();
                        return;
                    }
                    $rootScope.onLauncher = false;
                    $rootScope.onMatter = false;
                    $rootScope.onIntake = false;
                    $rootScope.onReferral = false;
                    $rootScope.onArchival = true;
                    $rootScope.onMarkerplace = false;
                    $rootScope.onContactManager = false;
                    $rootScope.onExpense = false;
                    $rootScope.onReferralPrg = false;
                    checkIfLauncherActive();
                } else if (toState.url.indexOf("/expenseManager") > -1) {
                    if ($rootScope.isExpenseActive == 0) {
                        $rootScope.logout();
                        return;
                    }
                    $rootScope.onLauncher = false;
                    $rootScope.onMatter = false;
                    $rootScope.onIntake = false;
                    $rootScope.onReferral = false;
                    $rootScope.onArchival = false;
                    $rootScope.onMarkerplace = false;
                    $rootScope.onContactManager = false;
                    $rootScope.onExpense = true;
                    $rootScope.onReferralPrg = false;
                    checkIfLauncherActive();
                } else if (toState.name == "dashboard.critical-dates" ||
                    toState.name == "dashboard.tasks") {
                    $rootScope.onLauncher = false;
                    $rootScope.onMatter = true;
                    $rootScope.onIntake = false;
                    $rootScope.onReferral = false;
                    $rootScope.onArchival = false;
                    $rootScope.onMarkerplace = false;
                    $rootScope.onContactManager = false;
                    $rootScope.onExpense = false;
                    $rootScope.onReferralPrg = false;
                } else {
                    $rootScope.onLauncher = false;
                    $rootScope.onMatter = true;
                    $rootScope.onIntake = false;
                    $rootScope.onReferral = false;
                    $rootScope.onArchival = false;
                    $rootScope.onMarkerplace = false;
                    $rootScope.onContactManager = false;
                    $rootScope.onExpense = false;
                    $rootScope.onReferralPrg = false;
                }
            }

            var isLoggedIn = localStorage.getItem('loggedIn');
            var roleObj = masterData.getUserRole();
            var userRole = utils.isEmptyVal(roleObj) ? userRoleFromValue.role : roleObj.role;
            var firmId = utils.isEmptyVal(roleObj) ? userRoleFromValue.firm_id : roleObj.firm_id;

            //if the user doesn't have permission don't change the path 
            if (!userHasAccess(toState, userRole)) {
                e.preventDefault();
                return;
            }

            if (toState.name === 'terms') {
                return;
            }

            if (toState.name === 'create-firm') {
                localStorage.setItem("fromReferredMatterLink", true);
                return;
            }

            if (toState.name === 'referral-token-expired') {
                return;
            }

            if (toState.name === 'activate-user') {
                return;
            }

            if (toState.name === 'forgot-password') {
                if (isLoggedIn) {
                    e.preventDefault();
                    return;
                }
                return;
            }

            if (utils.isEmptyVal(fromState.name) && (toState.name === 'referred-in-matters' || toState.name === 'referred-in-intake')) {
                if (!isLoggedIn) {
                    e.preventDefault();
                    localStorage.setItem("fromReferredMatterLink", true);
                    if (toState.name === 'referred-in-matters') {
                        localStorage.setItem("gotoState", 'referred-matters');
                    }
                    if (toState.name === 'referred-in-intake') {
                        localStorage.setItem("gotoState", 'referred-intake');
                    }
                    $state.go('login');
                    return;
                } else if (isLoggedIn) {
                    localStorage.setItem("fromReferredMatterLink", true);
                    if (toState.name === 'referred-in-matters') {
                        $state.go('referred-matters');
                    }
                    if (toState.name === 'referred-in-intake') {
                        $state.go('referred-intake');
                    }
                }
            }

            if (utils.isEmptyVal(fromState.name) && !(toState.name === 'login')) {
                if (!isLoggedIn) {
                    e.preventDefault();
                    localStorage.clear();
                    sessionStorage.clear();
                    $state.go('login');
                    return;
                }
            }

            if (toState.name === 'login') {
                if (isLoggedIn) {
                    e.preventDefault();
                    $state.go('launcher');
                    return;
                } else {
                    localStorage.clear();
                    sessionStorage.clear();
                }

                if (utils.isEmptyVal(userRole)) {
                    return;
                }
            }

            if (toState.name === 'email-login') {
                if (isLoggedIn) {
                    e.preventDefault();
                    var url = globalConstants.webServiceBase + 'lexvia_referral/update_ref_matter';
                    $http.post(url, { ref_token: toParams.token })
                        .then(function () {
                            $state.go('referred-in-matters', { tab: 'in' });
                        });
                }
            }

            if (fromState.name === 'login') {
                if (!isLoggedIn) {
                    e.preventDefault();
                    localStorage.clear();
                    sessionStorage.clear();
                    $state.go('login');
                    return;
                }
            }

            var isFirmSelected = localStorage.getItem('isFirmSelected') == 'true';
            var isFromFirm = fromState.name === 'firms';
            var isFromLogin = fromState.name === 'login';
            var isToFirms = toState.name === 'firms';

            if (userRole !== 'LexviasuperAdmin' && isToFirms) {
                e.preventDefault();
                gotoDefaultState();
                return;
            }


            if (userRole === 'LexviasuperAdmin' && !isToFirms) {
                if (!isFirmSelected && firmId === null) {
                    e.preventDefault();
                    gotoDefaultState();
                    return;
                }
            }

            if (userRole === 'LexviasuperAdmin' && isToFirms) {
                if (isFirmSelected) {
                    e.preventDefault();
                    gotoDefaultState();
                    return;
                }
            }
        }


        function userHasAccess(toState, role) {
            if (utils.isEmptyVal(toState.rolesPermitted)) {
                return true;
            }

            return toState.rolesPermitted.indexOf(role) > -1;
        }

        function onStateChangeSuccess(ev, to, toParam, from, fromParam) {

            var fId = localStorage.getItem('fId');
            if (to.name != "login" && fId && !$rootScope.connection && globalConstants.useSignalr) {
                var uId = localStorage.getItem('userId');
                var hubName = 'firm' + fId;
                var tok = localStorage.getItem('accessToken');
                $rootScope.connection = new signalR.HubConnectionBuilder().withUrl(globalConstants.signalrUrl + hubName + '&userId=' + uId, {
                    accessTokenFactory: (function () {
                        return tok;
                    })
                }).configureLogging(signalR.LogLevel.Information).build();

                startConnection();

                $rootScope.connection.onclose(function () {
                    console.log("signalR connection closed!");
                    start();
                });
            }
            //close all the open modals
            $modalStack.dismissAll();
            $('.tooltip').remove();
            var stateName = $rootScope.onIntake ? 'intake-list' : 'matter-list';
            prevState = utils.isEmptyString(from.name) ? stateName : from;
            prevStateParams = fromParam;

            currentState = to || stateName;
            breadcrums = angular.isDefined(to.breadcrum) ? [{ name: '...' }].concat(to.breadcrum) : [];

            //unbind window scroll listner
            var windowEl = angular.element($window);
            windowEl.unbind("scroll");

        }

        function startConnection() {
            $rootScope.connection.start().then(function (data) {
                console.log("signalR connection started!");
            }).catch(function (err) {
                return console.error(err.toString());
            });
        }

        function start() {
            try {
                startConnection();
            } catch (err) {
                console.log(err);
                setTimeout(function () {
                    return start();
                }, 5000);
            }
        };

        function getPreviousState() {
            return prevState;
        }

        function goToPrevState() {
            prevState === 'matter-list' ? $state.go('matter-list') : $state.go(prevState.name, prevStateParams);
        }

        function getCurrentState() {
            return currentState;
        }

        function setBreadcrum(newCrum) {
            breadcrums = newCrum;
        }

        function addToBreadcrum(newCrums) {
            breadcrums = breadcrums.concat(newCrums);
        }

        function getBreadcrums() {
            return breadcrums;
        }
    }

    angular
        .module('cloudlex')
        .directive('errorToast', ['$rootScope', '$http', 'notification-service', '$state', 'globalConstants',
            function ($rootScope, $http, notificationService, $state, globalConstants) {
                return {
                    restrict: 'E',
                    link: linkFn
                };

                function linkFn(scope) {
                    scope.$watch(function () {
                        return $http.pendingRequests.length <= 0;
                    }, function (requestsOver) {
                        if (requestsOver) {
                            if ($rootScope.errors.length > 0) {
                                var errorMsg = utils.isEmptyString($rootScope.errors[0]) ? "Session Expired." : $rootScope.errors[0];
                                /* The condition is added to change the CSRF validation failed error message yo user friendly message */
                                if ($state.current.name === "login" && (errorMsg === "Unauthorized: CSRF validation failed" || errorMsg === "CSRF validation failed")) {
                                    errorMsg = "Login was unsuccessful. Please try again";
                                } else if ($state.current.name != "login" && (errorMsg === "Unauthorized: CSRF validation failed" || errorMsg === "CSRF validation failed")) {
                                    errorMsg = "You are unauthorized to access this service.";
                                }

                                notificationService.error(errorMsg);
                                $rootScope.errors = [];
                                if (localStorage.getItem('loggedIn')) {
                                    logout();
                                } else {
                                    localStorage.clear();
                                    sessionStorage.clear();
                                    $state.go('login');
                                }
                            }
                        }
                    });

                    function logout() {
                        var logoutUrl = globalConstants.webServiceBase + "services/user/logout";
                        localStorage.removeItem('loggedIn');
                        $http
                            .post(logoutUrl)
                            .then(function () {
                                localStorage.clear();
                                sessionStorage.clear();
                                $state.go('login');
                            });
                    }
                }


            }]);

})(angular);
