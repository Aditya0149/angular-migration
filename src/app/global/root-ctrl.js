(function (angular) {
    angular
        .module('cloudlex')
        .run(['masterData', 'userRole', 'loginDatalayer', function (masterData, userRole, loginDatalayer) {

            if (localStorage.getItem('loggedIn')) {
                loginDatalayer.setLogoutTime();
                var data = masterData.getMasterData();
                if (utils.isEmptyObj(data)) {
                    masterData.fetchMasterData();
                }
                utils.isEmptyObj(userRole) ? masterData.fetchUserRole() : masterData.setUserRole(userRole);
            }
        }])
        .controller('rootController', ['$rootScope', 'globalConstants', 'masterData', 'routeManager', 'loginDatalayer', '$state', 'notification-service', '$q', '$http',
            function ($rootScope, globalConstants, masterData, routeManager, loginDatalayer, $state, notificationService, $q, $http) {
                var vm = this;
                var hideNavFor = ['login', 'autologin', 'email-login', 'create-firm', 'referral-token-expired', 'terms', 'activate-user', 'forgot-password'];
                vm.logout = logout;
                $rootScope.logout = logout;
                vm.changeFavicon = changeFavicon;
                $rootScope.removeunwantedhtml = removeunwantedhtml;
                $rootScope.retainSearchText = {};
                $rootScope.retainFilters = {};
                $rootScope.showWaitMessage = false;
                localStorage.removeItem('lastScrollTopPosition');
                vm.display = {
                    sideNav: false,
                    drawer: false,
                };
                $rootScope.display = vm.display;
                $rootScope.faviconIcon = "favicon.ico";
                $rootScope.rootSelectedDocument = [];
                $rootScope.rootDocumentList = [];
                $rootScope.rootComposeMatterId = [];
                var OSName = "";
                if (navigator.appVersion.indexOf("Mac") != -1) {
                    OSName = "MacOS";
                };
                var isSafari = !!window.safari;
                var isChrome = !!window.chrome;
                if (OSName == "MacOS" && (isChrome == true || isSafari == true)) {
                    $rootScope.isChromeOnMac = true;
                } else {
                    $rootScope.isChromeOnMac = false;
                }

                $rootScope.errors = [];

                $rootScope.trustSrc = function (src) {
                    if (angular.isUndefined(src) || utils.isEmptyString(src)) {
                        return undefined;
                    }
                    if (src !== "NULL") {
                        var uriArr = src.split('/');
                        var filename = uriArr[uriArr.length - 2] + '/' + uriArr[uriArr.length - 1];
                        var dfilename = decodeURIComponent(filename);
                        filename = dfilename;
                        var filenameEncoded = encodeURIComponent(filename);
                        return globalConstants.webServiceBase + "lexviafiles/downloadfile/ViewDocument.json?filename=" + filenameEncoded + "&&containername=" + uriArr[uriArr.length - 3];
                    }
                }


                $rootScope.$state = $state;

                $rootScope.$watch(function () {
                    return routeManager.getCurrentState();
                }, function (currState) {
                    if (angular.isUndefined(currState)) {
                        return;
                    }
                    if (hideNavFor.indexOf(currState.name) > -1) {
                        vm.display.sideNav = false;
                    } else {
                        vm.display.sideNav = true;
                    }

                    if (currState.templateUrl == 'firms/firms.html') {
                        vm.hidenotification = true;
                        vm.hideMarketplace = false;
                    }
                    else {
                        vm.hidenotification = false;
                        vm.hideMarketplace = true;
                    }


                });

                $rootScope.$on('$stateChangeStart', routeManager.stateChangeStart);
                $rootScope.$on('$stateChangeSuccess', routeManager.onStateChangeSuccess);
                $rootScope.$on('favicon', function (event, data) {
                    changeFavicon(data); // 'Favicon change'
                });

                $rootScope.expandSidebar = function () {
                    $("#nav").addClass("show-nav-full");
                }

                $rootScope.collapseSidebar = function () {
                    $("#nav").removeClass("show-nav-full");
                }

                function removeunwantedhtml(value) {
                    return utils.removeunwantedHTML(value);
                }

                function logout() {
                    deletewebserviceurl().then(function () {
                        loginDatalayer.logoutUser()
                            .then(function (response) {
                                notificationService.success('You have logged out from the system.');
                                localStorage.clear();
                                sessionStorage.clear();
                                masterData.clearUserRole();
                                $state.go('login');
                            }, function (error) {
                                if (error.status == 406) { } else if (error.status == 401) {
                                    localStorage.clear();
                                    sessionStorage.clear();
                                    masterData.clearUserRole();
                                    $state.go('login');
                                }
                            });

                        if ($rootScope.SOCKET_NOTIFICATION && $rootScope.SOCKET_NOTIFICATION.readyState == WebSocket.OPEN) {
                            $rootScope.SOCKET_NOTIFICATION.close();
                        }
                    });

                }

                function deletewebserviceurl() {
                    var deferred1 = $q.defer();

                    navigator.serviceWorker.getRegistrations().then(
                        function (registrations) {
                            if (registrations.length > 0) {
                                registrations[0].pushManager.getSubscription().then(
                                    function (subcription) {
                                        if (subcription) {
                                            var deferred = $q.defer();
                                            var url = globalConstants.javaWebServiceBaseV4 + 'notification/delete_web_notification';
                                            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken'), 'Content-Type': "application/json" }
                                            $http({
                                                url: url,
                                                method: "DELETE",
                                                headers: token,// Add params into headers
                                                data: { end_point: subcription.endpoint }
                                            }).then(function (response) {
                                                deferred.resolve(response.data);
                                                deferred1.resolve();
                                            }, function (response) {
                                                deferred.reject(response.data);
                                            });
                                            return deferred.promise;
                                        }
                                        else {
                                            deferred1.resolve();
                                        }
                                    });
                            }
                            else {
                                deferred1.resolve();
                            }
                        });

                    return deferred1.promise;

                }



                function changeFavicon(src) {
                    var link = document.createElement('link'),
                        oldLink = document.getElementById('dynamic-favicon');
                    link.id = 'dynamic-favicon';
                    link.rel = 'shortcut icon';
                    link.href = src;
                    if (oldLink) {
                        document.head.removeChild(oldLink);
                    }
                    document.head.appendChild(link);
                }
            }
        ]);

})(angular);
