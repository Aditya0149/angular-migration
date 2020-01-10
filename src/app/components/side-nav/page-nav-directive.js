(function () {
    'use strict';

    angular.module('sideNavDrawer', []);

    angular
        .module('sideNavDrawer')
        .factory('sideNavHelper', sideNavHelper);

    sideNavHelper.$inject = ['globalConstants', '$rootScope'];
    function sideNavHelper(globalConstants, $rootScope) {

        function getCtrlTemplate(navOption) {
            if ($rootScope.onIntake) {
                return globalConstants.intakeGlobalPageInfo[navOption];
            } else if ($rootScope.onLauncher) {
                return globalConstants.launcherGlobalPageInfo[navOption];
            } else {
                return globalConstants.globalPageInfo[navOption];
            }

        }

        return {
            getCtrlTemplate: getCtrlTemplate
        }

    };

    angular
        .module('sideNavDrawer')
        .directive('clxSideNavDrawer', clxSideNavDrawer);

    clxSideNavDrawer.$inject = ['$document', '$rootScope'];
    function clxSideNavDrawer($document) {
        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/side-nav/page-nav.html',
            controller: sideNavController,
            link: linkFn,
            controllerAs: 'sideNav'
        };

        function linkFn(scope, element, attr, ctrl) {
            element.data('nav', true);
            var el = element[0];
        }


        return directive;
    }

    sideNavController.$inject = ['$rootScope', '$scope', '$q', '$timeout', 'sideNavHelper',
        'masterData', 'routeManager', 'scrollHelper', 'resetCallbackHelper', 'practiceAndBillingDataLayer', 'messageFactory', 'globalConstants', '$window'];
    function sideNavController($rootScope, $scope, $q, $timeout, sideNavHelper,
        masterData, routeManager, scrollHelper, resetCallbackHelper, practiceAndBillingDataLayer, messageFactory, globalConstants, $window) {
        var vm = this;


        vm.closeDrawer = closeDrawer;
        //vm.firmData = {API: "PHP", state: "mailbox"};
        //vm.displayUserImage = 'styles/images/profileImage.jpg';

        $scope.$watch(function () {
            return localStorage.getItem('userDp');
        }, function () {
            if (utils.isNotEmptyVal(localStorage.getItem('userDp'))) {
                vm.displayUserImage = localStorage.getItem('userDp');
            }
        });

        vm.firmData = JSON.parse(localStorage.getItem('firmSetting'));
        vm.loadPage = loadPage;
        $rootScope.loadPage = loadPage;
        vm.stopClickPropagation = stopClickPropagation;
        vm.dataReceived = false;
        vm.role = {};
        vm.notificationIntervalFlag = false;
        var count = 0;

        (function () {
            vm.display = {
                openDrawer: false,
                reloadPage: false,
                showDrawer: true
            };

            vm.pageInfo = {
                controller: '',
                templateUrl: 'app/'
            };
            vm.isFullScreen = false;
            // $rootScope.collapseSidebar();
            displayWorkflowIcon();
            callNotitfication();
        })();

        function displayWorkflowIcon() {
            var role = masterData.getUserRole();
            if ((role.role == globalConstants.adminrole) && (role.firm_id === null)) {

            } else {
                var response = practiceAndBillingDataLayer.getConfigurableData();
                response.then(function (data) {
                    var resData = data.matter_apps;                                   //promise
                    if (angular.isDefined(resData) && resData != '' && resData != ' ') {
                        vm.is_workflow = (resData.workflow == 1) ? true : false;
                        vm.is_fax = (resData.fax == 1) ? true : false;
                    }
                });
            }

        }

        $rootScope.$on('updateWorkflowIcons', function (updateworkflowIconevent) {
            displayWorkflowIcon();
        });

        $rootScope.$on('updateFaxIcons', function (updateFaxIcons) {
            displayWorkflowIcon();
        });



        $scope.$watch(function () {
            return masterData.getUserRole();
        }, function (role) {
            if (utils.isNotEmptyVal(role)) {
                vm.role = role;
                vm.dataReceived = true;
            }
        });

        var hideDrawerFor = ['firms'];
        $rootScope.$watch(function () {
            return routeManager.getCurrentState();
        }, function (currState) {
            if (angular.isUndefined(currState)) {
                return;
            }
            vm.display.showDrawer = hideDrawerFor.indexOf(currState.name) === -1;

            if (currState.name == 'global-office-edit' || currState.name == 'global-office-view' || currState.name == 'global-office-redirect'
                || currState.name == 'intakeglobal-office-redirect' || currState.name == 'intakeglobal-office-view' || currState.name == 'intakeglobal-office-edit' || currState.name == 'intakeoffice-view' || currState.name == 'office-view') {
                vm.display.showDrawer = false;

                vm.display.openDrawer = false;
                vm.display.reloadPage = false;
            }
        });

        $rootScope.$on('$stateChangeSuccess', function (ev, to, toParam, from, fromParam) {
            vm.display.openDrawer = false;
            window.isDrawerOpen = false;
            vm.isFullScreen = false;
            // $rootScope.collapseSidebar();
            $timeout(function () {
                $rootScope.$broadcast('drawer-closed');
                $rootScope.$broadcast('enable-scroll');
            }, 1000)
        });

        function closeDrawer() {
            vm.display.openDrawer = false;
            window.isDrawerOpen = false;
            vm.showme = false;
            vm.isFullScreen = false;
            // $rootScope.collapseSidebar();
            var isEmailModule = (vm.activePage == "Mailbox_v2" || vm.activePage == "Mailbox" || vm.activePage == "Search" || vm.activePage == "Notes") ? true : false;
            var iseFaxModule = (vm.activePage == "eFax") ? true : false;
            vm.activePage = "";

            $timeout(function () {
                $rootScope.$broadcast('drawer-closed', isEmailModule, iseFaxModule);
                $rootScope.$broadcast('enable-scroll');
            }, 1000);
            //$('body').addClass('simplebar');
            $('body').removeClass('maskBody');
            $('body').removeClass('no-custom-scroll');
        }

        $rootScope.$on('calendarFilter', function (event, data) {
            loadPage(data, event);
        })

        function loadPage(navOption, $event, fromNotify) {
            var fromNotificationTab = sessionStorage.getItem('fromNotificationtab');
            if (fromNotificationTab == "true") {
                sessionStorage.removeItem('fromNotificationtab');
                navOption == "Mailbox" ? localStorage.setItem("sideBarScrollEmailId", JSON.stringify($event)) : localStorage.setItem("sideBarScrollPostId", JSON.stringify($event));
            }
            var fromNotification = sessionStorage.getItem('fromNotification');
            if (fromNotification == "true") {
                if ($event.nid) {
                    localStorage.setItem("sideBarScrollPostId", JSON.stringify($event));
                } else {
                    sessionStorage.removeItem('fromNotification');
                }
            }
            vm.activePage = navOption;
            vm.launchpad = JSON.parse(localStorage.getItem('launchpadSetting'));
            vm.launchpadAccess = (vm.launchpad && vm.launchpad.enabled == 1) ? true : false;
            var pageInfo = sideNavHelper.getCtrlTemplate(navOption);

            if (vm.activePage == 'LauncherTask' && ($rootScope.onLauncher) && vm.launchpadAccess) {
                var intakecal = "intake/newTask/global-tasks/global-tasks.html";
                var launchercal = "LauncherGlobalTaskCtrl as LaunchGlobalTasks";
                var pageInfo = angular.copy(pageInfo);
                pageInfo.templateUrl = intakecal;
                pageInfo.controller = launchercal;
            }
            if (vm.activePage == 'Sidebar' && fromNotify == 'fromNotification') {
                localStorage.setItem('fromNotificationIconToTxt', true);
            } else {
                localStorage.setItem('fromNotificationIconToTxt', false);
            }

            var promise = getMasterDataIfRequired(pageInfo);
            promise.then(function () {
                setCallbacks(pageInfo);
                openDrawer($event, pageInfo);
            });

        }

        function setCallbacks(pageInfo) {
            resetCallbackHelper.setPageInfo(pageInfo);
            resetCallbackHelper.setDefaultCallback(openDrawerToReset);
            resetCallbackHelper.setCallback(undefined);
            scrollHelper.setReachedBottom(angular.noop);
            scrollHelper.setReachedTop(angular.noop);
        }

        function getMasterDataIfRequired(pageInfo) {
            var deferred = $q.defer();
            if (pageInfo.masterData) {

                var data = masterData.getMasterData();
                if (utils.isEmptyObj(data)) {
                    masterData
                        .fetchMasterData()
                        .then(function () {
                            deferred.resolve();
                        })
                } else {
                    deferred.resolve();
                }
            } else {
                deferred.resolve();
            }
            return deferred.promise;
        }

        function openDrawer($event, pageInfo) {
            //$event.stopPropagation();//stop the body click event propagation
            $rootScope.$broadcast('disable-scroll');//disable the scroll
            vm.display.openDrawer = true;//open the drawer
            window.isDrawerOpen = true;
            $rootScope.$broadcast('drawer-opened');//tell eveeryone the drawer is open
            //reload a new page
            vm.display.reloadPage = false;
            vm.pageInfo.controller = pageInfo.controller;
            vm.pageInfo.templateUrl = pageInfo.templateUrl;

            $timeout(function () {
                vm.display.reloadPage = true;
            }, 500);
        }

        function openDrawerToReset(pageInfo) {
            $scope.$apply(function () {
                openDrawer('', pageInfo);
            });
        }

        function stopClickPropagation($event) {
            //  $event.stopPropagation();//stop the body click event propagation
        }

        function callNotitfication() {
            var role = masterData.getUserRole();
            var userId = localStorage.getItem('userId')
            if ((role.client_portal == '1')) {
                if (vm.notificationIntervalFlag) {
                    clearInterval(notificationInterval);
                    vm.notificationIntervalFlag = false;
                }
                var notificationInterval = setInterval(function () {
                    if (utils.isNotEmptyVal(localStorage.getItem('loggedIn'))) {
                        vm.notificationIntervalFlag = true;
                        closeNotificationSocket();
                        openNotificationSocket(role, userId);
                    } else {
                        clearInterval(notificationInterval);
                        vm.notificationIntervalFlag = false;
                    }
                }, 300000); // (300000 = 5min)  // 1000 ms = 1sec;
            }

        }

        function openNotificationSocket(role, userId) {
            var socketType = 'notification'; // either message or notification
            $rootScope.SOCKET_NOTIFICATION = messageFactory.openWebSocket(role.firm_id, 0, userId, null, socketType);
            setNotificationSocketCallbacks(role, userId);
        }


        function setNotificationSocketCallbacks(role, userId) {

            $rootScope.SOCKET_NOTIFICATION.onopen = function (event) {
                $rootScope.SOCKET_NOTIFICATION.send(JSON.stringify({ "fromType": "CL" }));


            };

            /* Whenever there is a new message this function is called*/
            $rootScope.SOCKET_NOTIFICATION.onmessage = function (event) {
                // console.log("Message Received");
                if (event.data == 'Unauthorized') {
                    console.log("Unauthorized");
                } else {
                    var receivedMessage = JSON.parse(event.data);
                    $rootScope.$emit('messageList', receivedMessage);
                }
            };

            $rootScope.SOCKET_NOTIFICATION.onerror = function (event) {
                // console.log("Error Occurred");
            }

            $rootScope.SOCKET_NOTIFICATION.onclose = function (event) {
                // console.log("on closed " + event);
                if (count > 1) {
                    // console.log('Error Occurred: Error Code-' + event.code + 'Error Message: ' + event.reason);
                    // notificationService.error('Error' + event.code);
                }
                else if (event.code != 1000 && event.code != 1001) {
                    count++;
                    setTimeout(function () {
                        openNotificationSocket(role, userId);
                        // setNewSocketCallbacks();
                    }, 1000);
                }
                else if (event.code == 1001) {//For reopening Socket Connection
                    // console.log("Socket Closed: " + event.reason)
                    setTimeout(function () {
                        openNotificationSocket(role, userId);
                        // setNewSocketCallbacks();
                    }, 1000);
                }
            }
        }

        function closeNotificationSocket() {
            if ($rootScope.SOCKET_NOTIFICATION) {
                $rootScope.SOCKET_NOTIFICATION.close();
                // console.log("Old Socket Closed");
            }
        }

        $window.onbeforeunload = function () {
            if ($rootScope.SOCKET_NOTIFICATION && $rootScope.SOCKET_NOTIFICATION.readyState == WebSocket.OPEN) {
                $rootScope.SOCKET_NOTIFICATION.close();
                // console.log("Old Socket Closed");
            }
        }



    }

})();

//helper directive to load new page
(function () {
    angular
        .module('sideNavDrawer')
        .directive('clxLoadPage', clxReloadPage);

    clxReloadPage.$inject = ['$compile', '$parse'];
    function clxReloadPage($compile, $parse) {
        var reloadPageDirective = {
            restrict: 'E',
            link: linkFn
        }

        function linkFn(scope, el, attr) {
            var pageInfo = $parse(attr.pageInfo)(scope);
            var html = getTemplate(pageInfo);
            var newElement = $compile(html)(scope);
            el.replaceWith(newElement);
        }

        function getTemplate(pageInfo) {
            var html = '';
            html += '<div data-ng-include="\'' + pageInfo.templateUrl + '\'"';
            html += ' data-ng-controller="' + pageInfo.controller + '" >';
            return html;
        }


        return reloadPageDirective;
    }

    angular
        .module('sideNavDrawer')
        .directive('clxDisableScroll', function () {
            return {
                restrict: 'A',
                link: function (scope, el, attr) {
                    scope.$on('disable-scroll', function (e) {
                        el.addClass('maskBody');
                        el.addClass('no-custom-scroll');
                        //el.removeClass('simplebar');
                    });

                    scope.$on('enable-scroll', function (e) {
                        //el.addClass('simplebar');
                        el.removeClass('maskBody');
                        el.removeClass('no-custom-scroll');
                    });

                }
            }
        });


    //el.bind('click', function () {
    //    el.removeClass('maskBody');
    //});

    //angular
    //    .module('sideNavDrawer')
    //    .directive('clxMaskBody', function () {
    //        return {
    //            restrict: 'A',
    //            link: function (scope, el, attr) {
    //                scope.$on('drawer-opened', function (e) {
    //                    el.addClass('mask');
    //                });

    //                scope.$on('drawer-closed', function (e) {
    //                    el.removeClass('mask');
    //                });
    //            }
    //        }
    //    })

})();


(function () {


    angular
        .module('sideNavDrawer')
        .factory('resetCallbackHelper', resetCallbackHelper);

    function resetCallbackHelper() {
        var onReset, defaultOnReset, pageInfo;

        return {
            setDefaultCallback: _setDefaultCallback,
            getDefaultCallback: _getDefaultCallback,
            setCallback: _setCallback,
            getCallback: _getCallback,
            setPageInfo: _setPageInfo,
            getPageInfo: _getPageInfo
        };
        function _setDefaultCallback(defaultReset) {
            defaultOnReset = defaultReset;
        }

        function _getDefaultCallback() {
            return defaultOnReset;
        }

        function _setCallback(callback) {
            onReset = callback;
        }

        function _getCallback() {
            return onReset;
        }

        function _setPageInfo(navopt) {
            pageInfo = navopt;
        }

        function _getPageInfo() {
            return pageInfo;
        }

    }

    angular
        .module('sideNavDrawer')
        .directive('resetGlobalPage', resetGlobalPage);

    resetGlobalPage.$inject = ["resetCallbackHelper"];
    function resetGlobalPage(resetCallbackHelper) {
        var directive = {
            restrict: 'A',
            link: linkFn
        };

        function linkFn(scope, el) {
            el.bind("click", reset);
        }

        function reset() {
            angular.isDefined(resetCallbackHelper.getCallback()) ?
                resetCallbackHelper.getCallback()() :
                resetCallbackHelper.getDefaultCallback()(resetCallbackHelper.getPageInfo());
        }

        return directive;
    }

    angular
        .module('sideNavDrawer')
        .directive('whenScrollEnds', ['scrollHelper', function (scrollHelper) {
            return {
                restrict: "A",
                link: function (scope, element, attrs) {
                    var visibleHeight = element[0].clientHeight;
                    var threshold = 100;

                    element.bind('scroll', function () {
                        var scrollableHeight = element.prop('scrollHeight');
                        var hiddenContentHeight = scrollableHeight - visibleHeight;

                        if (hiddenContentHeight - element[0].scrollTop <= threshold) {
                            // Scroll is almost at the bottom. Loading more rows
                            scope.$apply(function () {
                                scrollHelper.getReachedBottom()();
                            });
                        }
                    });
                }
            };
        }])
        .directive('reachedTop', ['scrollHelper', function (scrollHelper) {
            return {
                restrict: "A",
                link: function (scope, element, attrs) {
                    element.bind('scroll', function () {
                        if (element[0].scrollTop === 0) {
                            scope.$apply(function () {
                                scrollHelper.getReachedTop()();
                            });
                        }
                    });
                }
            };
        }]);

    angular
        .module('sideNavDrawer')
        .factory('scrollHelper', scrollHelper)

    var reachedBottom, reachedTop;

    function scrollHelper() {
        return {
            getReachedBottom: _getReachedBottom,
            setReachedBottom: _setReachedBottom,
            getReachedTop: _getReachedTop,
            setReachedTop: _setReachedTop
        };

        function _getReachedBottom() {
            return reachedBottom;
        }

        function _setReachedBottom(reachedBottomFn) {
            reachedBottom = reachedBottomFn;
        }

        function _getReachedTop() {
            return reachedTop;
        }

        function _setReachedTop(reachedTopFn) {
            reachedTop = reachedTopFn

        }
    }

})();


//scope.$on('body-clicked', function (e) {
//    el.removeClass('mask');
//});

//$scope.$on('body-clicked', function () {
//    if (vm.display.openDrawer) {
//        $scope.$apply(function () {
//            //vm.display.openDrawer = false;
//        });
//        $rootScope.$broadcast('drawer-closed');
//    } else {
//        $rootScope.$broadcast('drawer-closed');
//    }
//});


//function linkFn(scope, element, attr, ctrl) {
//    element.data('nav', true);

//    angular.element($document[0].body).on('click', function (e) {
//        var clickedOnPopUp = angular.element(e.target).inheritedData('nav');
//        if (!clickedOnPopUp) {
//            //ctrl.closeDrawer();
//        }
//    })
//}