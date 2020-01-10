(function (angular) {
    'use strict';

    angular
        .module('cloudlex.launcher')
        .controller('launcherCtrl', LauncherController)

    LauncherController.$inject = ["$scope", "$modal", "launcherDatalayer", "masterData", "$state", "notification-service", 'dashboardDatalayer', '$rootScope', 'modalService', 'applicationsDataLayer', 'globalConstants', '$q', '$http', 'pushNotificatioHelper']

    function LauncherController($scope, $modal, launcherDatalayer, masterData, $state, notificationService, dashboardDatalayer, $rootScope, modalService, applicationsDataLayer, globalConstants, $q, $http, pushNotificatioHelper) {
        var vm = this;
        vm.isActive = isActive;
        $scope.showSearch = false;
        $scope.isChromeOnMac = $rootScope.isChromeOnMac;
        vm.showDetailsData = showDetails;
        vm.applycss = applycss;
        vm.showPopups = showPopups;
        vm.save = saveProfile;
        vm.viewImage = viewImage;
        $scope.isIntakeManagerSelected = check_cookie() == 'mm2' ? true : false;
        $scope.isMatterManagerSelected = check_cookie() == 'mm1' ? true : false;
        vm.myInterval = 3000;
        vm.allfirmData = JSON.parse(localStorage.getItem('allFirmSetting'));
        vm.isSMSEnables = false;
        var gracePeriodDetails = masterData.getUserRole();
        if (gracePeriodDetails.role == "Managing Partner/Attorney" || gracePeriodDetails.role == "LexviasuperAdmin") {
            vm.showReferralProgram = true;
        } else {
            vm.showReferralProgram = false;
        }
        _.forEach(vm.allfirmData, function (item) {
            if (item.state == "SMS") {
                vm.isSMSEnables = (item.enabled == 1) ? true : false;
            }
        });
        vm.slides = [
            // {
            //     image: '../styles/images/launcher-icons/Banner_IntakeManager.svg?v=166',
            // }, {
            //     image: '../styles/images/launcher-icons/sms-banner-small.svg?v=1662',
            // },
            // {
            //     image: '../styles/images/launcher-icons/Banner_Expense Manager_Launchpad.svg?v=787',
            // }
        ]
        getConfiguredData();
        var ua = window.navigator.userAgent,
            safariTxt = ua.indexOf("Safari"),
            chrome = ua.indexOf("Chrome"),
            firefox = ua.indexOf("Firefox"),
            edge = ua.indexOf("Edge")
        if (chrome > -1 || firefox > -1 || edge > -1) {
            pushNotificatioHelper.requestBrowserPermission();
        }


        function CheckTotalAccess(key) {
            var appActiveCheck = checkIfAppActive(key);
            var appAccessCheck = checkIfAppUserActive(key);
            return appActiveCheck == 1 && appAccessCheck == 1 ? 1 : 0;

        }
        function viewImage(value) {
            // if (value == "../styles/images/launcher-icons/sms-banner-small.svg?v=1662") {
            //     showDetails('SMS');
            // } else if (value == "../styles/images/launcher-icons/Banner_IntakeManager.svg?v=166") {
            //     showDetails('IM');
            // } 
            // if (value == "../styles/images/launcher-icons/Banner_Expense Manager_Launchpad.svg?v=787") {
            //     showDetails('EM');
            // }
        }

        function getAppList() {
            launcherDatalayer.getAppAccess().then(function (response) {
                vm.appList = response.user_permission;
                $rootScope.isDigiArchivalSub = CheckTotalAccess("DA");
                $rootScope.isReferalActive = CheckTotalAccess("RE");
                $rootScope.isIntakeActive = CheckTotalAccess("IM");
                $rootScope.isSmsActive = CheckTotalAccess("SMS");
                $rootScope.isExpenseActive = CheckTotalAccess("EM");
                ////////
                $rootScope.isDigiArchivalSubUI = checkIfAppActive("DA");
                $rootScope.isReferalActiveUI = checkIfAppActive("RE");
                $rootScope.isIntakeActiveUI = checkIfAppActive("IM");
                $rootScope.isSmsActiveUI = checkIfAppActive("SMS");
                $rootScope.isExpenseActiveUI = checkIfAppActive("EM");
                $rootScope.isUserDigiArchivalSub = checkIfAppUserActive("DA");
                $rootScope.isUserReferalActive = checkIfAppUserActive("RE");
                $rootScope.isUserIntakeActive = checkIfAppUserActive("IM");
                $rootScope.isUsertSmsActive = checkIfAppUserActive("SMS");
                $rootScope.isUserExpenseActive = checkIfAppUserActive("EM");

                localStorage.setItem("isDigiArchivalSub", $rootScope.isDigiArchivalSub);
                localStorage.setItem("isReferalActive", $rootScope.isReferalActive);
                localStorage.setItem("isIntakeActive", $rootScope.isIntakeActive);
                localStorage.setItem("isSmsActive", $rootScope.isSmsActive);
                localStorage.setItem("isExpenseActive", $rootScope.isExpenseActive);
                $scope.showSearch = false;
            });
        }

        function showDetails(selected) {
            switch (selected) {
                case "RE":
                    $state.go('referral-details');
                    break;
                case "DA":
                    $state.go('digatl-archival-details');
                    break;
                case "IM":
                    $state.go('intake-manager-details');
                    break;
                case "SMS":
                    $state.go('sms-details');
                    break;
                case "LG":
                    $state.go('lead-generator');
                    break;
                case "EM":
                    //Go to Application Details
                    $state.go('expense-manager');
                    break;
            }
        }

        function getConfiguredData() {
            $scope.showSearch = true;
            var response = applicationsDataLayer.getConfigurableData();
            response.then(function (data) {
                vm.applicationlist = data.applications;
                _.forEach(data.applications, function (application) {
                    switch (application.app_code) {
                        case "CCOM":
                            vm.isCloudlexCommunicator = application;
                            break;
                        case "RE":
                            vm.isRefferalEngine = application;
                            break;
                        case "DA":
                            vm.isDigitalArchival = application;
                            break;
                        case "IT":
                            vm.isIntegratingTools = application;
                            break;
                        case "OPLG":
                            vm.isWordOfficePlugin = application;
                            break;
                        case "OTLG":
                            vm.isOutlookPlugin = application;
                            break;
                        case "O365":
                            vm.isOfficeOnline = application;
                            //(application.payment_status) ? vm.paymentFlag = false : vm.paymentFlag = true;
                            break;
                        case "IM":
                            vm.isIntakeManager = application;
                            break;
                        case "GA":
                            vm.isgmailPlugin = application;
                            break;
                        case "EM":
                            vm.isExpenseManger = application;
                            break;
                    }
                });
                getAppList();

            });
        }

        function saveProfile(data, Flag, SucribedDiv) {
            if (Flag == 'DA') {
                isDigitalArchival(data, SucribedDiv);
            } else if (Flag == 'RE') {
                isReferralExchange(data, SucribedDiv);
            } else if (Flag == 'IM') {
                isIntakeManager(data, SucribedDiv);
            } else if (Flag == 'CCOM') {
                clientCommunicator(data, SucribedDiv);
            } else {
                isMicrosoftOnline(data, SucribedDiv);
            }
        }

        function isDigitalArchival(data, SucribedDiv) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Subscribe',
                headerText: 'Subscribe to Digital Archiver',
                bodyText: 'By subscribing to Digital Archiver you will be able to archive closed matters for a one time fee. Please contact us to discuss pricing at (646) 415-8307.'
            };

            //confirm before subscribe
            modalService.showModal({}, modalOptions).then(function () {
                var postDataObj = {
                    application_id: data.id,
                    status: 1
                }
                var response = applicationsDataLayer.saveProfileData(postDataObj);
                response.then(function (data) {
                    if (angular.isDefined(data) && data != '' && data != ' ') {
                        notificationService.success('You have successfully subscribed to Digital Archiver');
                        //   resetaftersubcribed(SucribedDiv);
                        getConfiguredData();
                    }
                }, function (error) {
                    notificationService.error(error.data[0]);
                });
            });
        }

        /**
         * Intake Manager subscribe
         */
        function isIntakeManager(data, SucribedDiv) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Subscribe',
                headerText: 'Subscribe to Intake Manager',
                bodyText: 'Are you sure you want to subscribe to Intake Manager'
            };

            //confirm before subscribe
            modalService.showModal({}, modalOptions).then(function () {
                var postDataObj = {
                    application_id: data.id,
                    status: 1
                }
                var response = applicationsDataLayer.saveProfileData(postDataObj);
                response.then(function (data) {
                    if (angular.isDefined(data) && data != '' && data != ' ') {
                        //$rootScope.$emit('updatereferralIcon','updateIcon');
                        notificationService.success('You have successfully subscribed to Intake Manager');
                        //  resetaftersubcribed(SucribedDiv);
                        getConfiguredData();
                    }
                }, function (error) {
                    notificationService.error(error.data[0]);
                });
            });
        }

        /**
         * Referral Engine subscribe
         */
        function isReferralExchange(data, SucribedDiv) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Subscribe',
                headerText: 'Subscribe to Referral Engine',
                bodyText: 'Are you sure you want to subscribe to Referral Engine?'
            };

            //confirm before subscribe
            modalService.showModal({}, modalOptions).then(function () {
                var postDataObj = {
                    application_id: data.id,
                    status: 1
                }
                var response = applicationsDataLayer.saveProfileData(postDataObj);
                response.then(function (data) {
                    if (angular.isDefined(data) && data != '' && data != ' ') {
                        $rootScope.$emit('updatereferralIcon', 'updateIcon');
                        notificationService.success('You have successfully subscribed to Referral Engine');
                        //   resetaftersubcribed(SucribedDiv);
                        getConfiguredData();
                    }
                }, function (error) {
                    notificationService.error(error.data[0]);
                });
            });
        }

        function checkIfAppActive(appKey) {
            var appPermissions = _.filter(vm.appList, function (entity) {
                if (entity.app_code == appKey) {
                    return entity;
                }
            });
            if (appPermissions && appPermissions.length > 0) {
                //  return appPermissions[0].is_active == 1 && appPermissions[0].permission == 1 ? 1 : 0
                return appPermissions[0].is_active == 1 ? 1 : 0
            } else {
                return 0;
            }
        }

        function checkIfAppUserActive(appKey) {
            var appPermissions = _.filter(vm.appList, function (entity) {
                if (entity.app_code == appKey) {
                    return entity;
                }
            });
            if (appPermissions && appPermissions.length > 0) {
                return appPermissions[0].permission == 1 ? 1 : 0

            } else {
                return 0;
            }
        }

        function getAppName(appKey) {
            var appPermissions = _.filter(vm.appList, function (entity) {
                if (entity.app_code == appKey) {
                    return entity;
                }
            });
            return appPermissions && appPermissions.length > 0 ? angular.copy(appPermissions[0].app_name) : "";
        }

        function setIsDefaultStyle(id, id2) {
            $("#mm1").removeClass("active");
            $("#mm2").removeClass("active");
            $("#mm3").removeClass("active");
            $("#mm4").removeClass("active");

            $("#mmi1").removeClass("star-icon-select");
            $("#mmi2").removeClass("star-icon-select");
            $("#mmi3").removeClass("star-icon-select");
            $("#mmi4").removeClass("star-icon-select");
            if (id) {
                $(id).addClass("active");
                $(id2).addClass("star-icon-select");
            }
        }

        (function () {
            var exstingDefaultApp = check_cookie();
            if (utils.isEmptyString(exstingDefaultApp)) {
                setIsDefaultStyle();
            } else {
                switch (exstingDefaultApp) {
                    case 'mm1':
                        setIsDefaultStyle("#mm1", "#mmi1");
                        break;
                    case 'mm2':
                        setIsDefaultStyle("#mm2", "#mmi2");
                        break;
                    case 'mm3':
                        setIsDefaultStyle("#mm3", "#mmi3");
                        break;
                    case 'mm4':
                        setIsDefaultStyle("#mm4", "#mmi4");
                        break;
                }
            }

            vm.is_admin = (gracePeriodDetails.is_admin == 1) ? true : false;
            vm.is_Subscriber = (gracePeriodDetails.is_subscriber == 1) ? true : false;
            $scope.userName = [localStorage.getItem("user_fname"), localStorage.getItem("user_lname")].join(" ");
            vm.showWhatsnew = gracePeriodDetails.user_notification_status;
            showFeedBack();
        })();

        function showFeedBack() {
            /// uncomment below code when you want to show NPS feedback.
            // dashboardDatalayer.getFeedback().then(function (response) {
            //     if (response && response.data == "false") {
            //         vm.openNetPromoterScore();
            //     } else {
            localStorage.setItem("feedbackShown", "true");
            var showWhatsNewPopUp = localStorage.getItem('showWhatsNew');
            if (showWhatsNewPopUp != '1') {
                //code to show whatsnew popup for all user in launcher
                showPopups();
            }
            //     }
            // });
        }

        vm.openNetPromoterScore = function () {
            var modalInstance = $modal.open({
                templateUrl: 'app/dashboard/feedback.html',
                controller: 'NetPromoterScorePopupCtrl as nps',
                size: 'lg',
                windowClass: 'whats-new-popup',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    Prevstate: function () {
                        return vm.Prevstate;
                    },
                }
            });

            modalInstance.result.then(function (response) {
                var showWhatsNewPopUp = localStorage.getItem('showWhatsNew');
                if (showWhatsNewPopUp != '1') {
                    //code to show whatsnew popup for all user in launcher
                    showPopups();
                }

            }, function () {
                showPopups();

            });

        }

        function showPopups() {
            if (vm.showWhatsnew == 0) {
                //localStorage.setItem('showWhatsNew', '1');
                var modalInstance = $modal.open({
                    templateUrl: 'app/dashboard/whatsnew.html',
                    controller: 'WhatsNewPopupCtrl as wp',
                    size: 'lg',
                    windowClass: 'whats-new-popup',
                    backdrop: 'static',
                    keyboard: false,
                });
            }
        }

        function applycss(link, e) {
            e.stopPropagation();
            var cookieVal = '';
            var exstingDefaultApp = check_cookie();
            if (exstingDefaultApp == link) {
                var userName = localStorage.getItem('user_email');
                delete_cookie(userName + "@default_app");
                setIsDefaultStyle();
                return;
            }

            switch (link) {
                case 'mm1':
                    setIsDefaultStyle("#mm1", "#mmi1");
                    cookieVal = 'MM';
                    $scope.isIntakeManagerSelected = false;
                    $scope.isMatterManagerSelected = true;
                    break;
                case 'mm2':
                    setIsDefaultStyle("#mm2", "#mmi2");
                    cookieVal = 'IM';
                    $scope.isIntakeManagerSelected = true;
                    $scope.isMatterManagerSelected = false;
                    break;
                case 'mm3':
                    setIsDefaultStyle("#mm3", "#mmi3");
                    cookieVal = 'RE';
                    break;
                case 'mm4':
                    setIsDefaultStyle("#mm4", "#mmi4");
                    cookieVal = 'AR';
                    break;
            }
            // setting persistent cookies 
            // set cookies expiry in 1 year 
            var expiration_date = new Date();
            var cookie_string = '';
            expiration_date.setFullYear(expiration_date.getFullYear() + 1);
            var userName = localStorage.getItem('user_email');
            // Build the set-cookie string:
            cookie_string = userName + "@default_app = " + cookieVal + "; path=/; expires=" + expiration_date.toUTCString();
            // Create or update the cookie:
            document.cookie = cookie_string;
        }

        function check_cookie() {
            var cookieKey = "default_app=";
            var userName = localStorage.getItem('user_email');
            cookieKey = userName + '@' + cookieKey;
            if (document.cookie.split(';').filter(function (item) {
                var cookiesValue = item;
                return item.indexOf(cookieKey) >= 0
            }).length) {
                if (document.cookie.split(';').filter(function (item) {
                    return item.indexOf(cookieKey + 'MM') >= 0
                }).length) {
                    return "mm1";
                } else if (document.cookie.split(';').filter(function (item) {
                    return item.indexOf(cookieKey + 'IM') >= 0
                }).length) {
                    return "mm2";
                } else if (document.cookie.split(';').filter(function (item) {
                    return item.indexOf(cookieKey + 'RE') >= 0
                }).length) {
                    return "mm3";
                } else if (document.cookie.split(';').filter(function (item) {
                    return item.indexOf(cookieKey + 'AR') >= 0
                }).length) {
                    return "mm4";
                } else {
                    return "";
                }

            } else {
                return "";
            }
        }

        function delete_cookie(name) {
            document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }
        vm.stopEvent = stopEvent;

        function stopEvent(e) {
            e.stopPropagation();
            $("#toggleDiv").toggle();
        }

        vm.stopEventOnDefalult = stopEventOnDefalult;

        function stopEventOnDefalult(e) {
            e.stopPropagation();
        }

        vm.stopIntakeEvent = stopIntakeEvent;

        function stopIntakeEvent(e) {
            e.stopPropagation();
            $("#toggleIntakeDiv").toggle();
        }

        function isActive(tab, stateName, $event) {
            $rootScope.$emit("closeBell");
            $event ? $event.stopPropagation() : angular.noop();
            var hasAccess = true;
            var appName = '';
            var msg = "You do not have access to this application. Please contact your SMP/Administrator to get access.";
            switch (tab) {
                case 'DA':
                    if ($rootScope.isUserDigiArchivalSub) {
                        $state.go('archival');
                    } else {
                        hasAccess = false;
                        // appName = getAppName(tab);
                        // if ($scope.launcher.appList[1].permission && hasAccess == false) {
                        //     msg = "Please subscribe to " + appName + " from the Marketplace."
                        // }
                    }
                    break;
                case 'RE':
                    if ($rootScope.isUserReferalActive) {
                        $state.go('referred-matters');
                    } else {
                        hasAccess = false;
                        appName = getAppName(tab);
                        // if ($scope.launcher.appList[0].permission && hasAccess == false) {
                        //     msg = "Please subscribe to " + appName + " from the Marketplace."
                        // }
                    }
                    break;
                case 'IM':
                    if ($rootScope.isUserIntakeActive) {
                        $state.go(stateName);
                    } else {
                        hasAccess = false;
                        // appName = getAppName(tab);
                        // if ($scope.launcher.appList[2].permission && hasAccess == false) {
                        //     msg = "Please subscribe to " + appName + " from the Marketplace."
                        // }
                    }
                    break;
                case 'MM':
                    $state.go(stateName);
                    break;
                case 'CM':
                    $state.go('launcherglobalContact');
                    break;
                case 'EM':
                    // US16929: Expense Manager (Quickbooks integration)
                    //On click on Expense Manager nevigate to expense Manager grid list
                    if ($rootScope.isUserExpenseActive) {
                        $state.go('expenseManager');
                    } else {
                        hasAccess = false;
                    }
                    break;
            }

            if (!hasAccess) {
                // if (vm.is_admin) {
                //     appName = getAppName(tab);
                //     msg = "Please subscribe to " + appName + " from the Marketplace."
                // }
                notificationService.error(msg);
            }
        }

        function getRecentActivitiesForFirm() {
            launcherDatalayer.getRecentActivities().then(function (response) {
                vm.recentActivities = response;
            })
        }

        function getMatterCountForLauncher() {
            launcherDatalayer.getmattercount()
                .then(function (response) {
                    $scope.matterCount = response.data;
                })
        }
    }

})(angular);
