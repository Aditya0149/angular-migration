angular.module('cloudlex.components')
    .controller('PageHeaderCtrl', ['$http', '$scope', '$state', 'routeManager', 'notificationDatalayer', 'globalConstants', '$modal', 'notification-service', 'masterData', '$rootScope', 'practiceAndBillingDataLayer', 'workflowHelper', 'mailboxDataServiceV2', 'launcherDatalayer', 'toaster',

        function ($http, $scope, $state, routeManager, notificationDatalayer, globalConstants, $modal, notificationService, masterData, $rootScope, practiceAndBillingDataLayer, workflowHelper, mailboxDataServiceV2, launcherDatalayer, toaster) {

            var vm = this;
            $rootScope.hideSMS = globalConstants.hideSMS;
            $scope.hideNoti = true;
            vm.showMessageFlag = false;
            vm.showDetailsData = showDetails;
            //US#4713 Plan subscription End Date Message for User ....Start 
            var gracePeriodDetails = masterData.getUserRole();
            var gracePeriodEndDate = gracePeriodDetails.grace_period_end_date;
            vm.is_admin = (gracePeriodDetails.is_admin == 1) ? true : false;
            var planSubEndDate = gracePeriodDetails.plan_subscription_end_date;
            vm.planSubEndDate = moment.unix(planSubEndDate).format('MM/DD/YYYY hh:mm A');
            vm.gracePeriodEndDate = moment.unix(gracePeriodEndDate).format('MM/DD/YYYY');
            vm.openNotifications = openNotifications;
            vm.firmData = { API: "PHP", state: "mailbox" };
            var currentdate = new Date();
            currentdate = moment(currentdate);
            planSubEndDate = moment(vm.planSubEndDate);
            if (planSubEndDate.isBefore(currentdate)) {
                vm.showMessageFlag = true;
            }
            vm.isActive = isActive;
            vm.isSMSEnables = false;
            vm.isEmailSubscribed = gracePeriodDetails.email_subscription;
            vm.allfirmData = JSON.parse(localStorage.getItem('allFirmSetting'));
            _.forEach(vm.allfirmData, function (item) {
                if (item.state == "entity_sharing") {
                    vm.isCollaborationActive = (item.enabled == 1) ? true : false;
                }
                if (item.state == "SMS") {
                    vm.isSMSEnables = (item.enabled == 1) ? true : false;
                }
            });

            function openNotifications(e) {
                $scope.hideNoti = !$scope.hideNoti;
                setTimeout(function () {
                    if (!$scope.hideNoti) {
                        vm.totalCount = 0;
                        notificationDatalayer.setUserFirstReadTime()
                            .then(function (res) {
                                vm.totalCount = 0;
                            });
                        $("#notification-bell-menu").css("display", "block");
                    } else {
                        _.forEach(vm.notificationList, function (it) {
                            it.notiDots = false;
                        });
                        $("#notification-bell-menu").css("display", "none");
                    }
                }, 10);
            }

            $("#notification-bell-menu").clickOff(function (parent, event) {
                if (event && event.target && event.target.id == "dropdownMenuNotification") {
                    return;
                }
                if (vm.notificationList && !$scope.hideNoti) {
                    $scope.$apply(function () {
                        $scope.hideNoti = !$scope.hideNoti;
                    });

                    _.forEach(vm.notificationList, function (it) {
                        it.notiDots = false;
                    });
                }
            });

            vm.hideNotify = function () {
                $("#notification-bell-menu").css("display", "none");
            }

            //... End 
            function getAppList() {
                var role = masterData.getUserRole();
                if ((role.role == globalConstants.adminrole) && (role.firm_id === null)) {

                } else {
                    launcherDatalayer.getAppAccess().then(function (response) {
                        vm.appList = response.user_permission;

                        // Flags for firm access + user access
                        $rootScope.isDigiArchivalSub = CheckTotalAccess("DA");
                        $rootScope.isReferalActive = CheckTotalAccess("RE");
                        $rootScope.isIntakeActive = CheckTotalAccess("IM");
                        $rootScope.isSmsActive = CheckTotalAccess("SMS");
                        $rootScope.isExpenseActive = CheckTotalAccess("EM");

                        // Flags for firm access
                        $rootScope.isDigiArchivalSubUI = checkIfAppActive("DA");
                        $rootScope.isReferalActiveUI = checkIfAppActive("RE");
                        $rootScope.isIntakeActiveUI = checkIfAppActive("IM");
                        $rootScope.isSmsActiveUI = checkIfAppActive("SMS");
                        $rootScope.isExpenseActiveUI = checkIfAppActive("EM");
                        // Flags for user access
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
                    });
                }

            }

            function showDetails(selected, e) {
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
                        $state.go('expense-manager');
                        break;
                }
            }

            function CheckTotalAccess(key) {
                var appActiveCheck = checkIfAppActive(key);
                var appAccessCheck = checkIfAppUserActive(key);
                return appActiveCheck == 1 && appAccessCheck == 1 ? 1 : 0;

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

            (function () {
                var supportSettings = JSON.parse(localStorage.getItem('supportSettings'));
                if (utils.isNotEmptyVal(supportSettings)) {
                    if (supportSettings.enabled == '1') {
                        vm.showSupport = true;
                    } else {
                        vm.showSupport = false;
                    }
                } else {
                    vm.showSupport = false;
                }

                vm.user_fname = localStorage.getItem('user_fname');
                vm.user_lname = localStorage.getItem('user_lname');
                vm.user_role = localStorage.getItem('userRole');
                vm.launchpad = JSON.parse(localStorage.getItem('launchpadSetting'));
                vm.launchpadAccess = (vm.launchpad && vm.launchpad.enabled == 1) ? true : false;

                /** Set  isPortalEnabled flag to show/hide client communicator icon **/
                if (!(angular.isDefined($rootScope.isPortalEnabled))) {
                    $rootScope.isPortalEnabled = (gracePeriodDetails.client_portal == '1') ? true : false;
                }

                vm.notifCounts = {};
                getNotificationCountData();



                var role = masterData.getUserRole();
                if ((role.role == globalConstants.adminrole) && (role.firm_id === null)) {
                    vm.hideSettings = true;
                } else {
                    vm.hideSettings = false;
                    getSubscriptionInfo();
                }
                getAppList();
                //utils.isEmptyVal(gracePeriodDetails.firm_id) ? angular.noop() : getSubscriptionInfo();
                /**
                 * firm basis module setting 
                 */
                var emailSettings = JSON.parse(localStorage.getItem('firmSetting'));
                if (!emailSettings) {
                    masterData.fetchFirmData().then(function (response) {
                        if (response) {
                            //store firm data in localstorage
                            vm.allfirmData = response;
                            // set java for contact APIs
                            _.forEach(vm.allfirmData, function (currentItem) {
                                if (currentItem.state == "contacts") {
                                    currentItem.API = "JAVA";
                                }
                            });
                            var contactSett = _.findWhere(vm.allfirmData, { state: "contacts" });
                            if (!contactSett) {
                                vm.allfirmData.push({ state: "contacts", API: "JAVA" });
                            }
                            localStorage.setItem('allFirmSetting', JSON.stringify(vm.allfirmData));
                            _.forEach(response, function (currentItem, index, array) {
                                if (currentItem.state == "mailbox") {
                                    vm.firmData = currentItem;
                                }
                            });
                            localStorage.setItem('firmSetting', JSON.stringify(vm.firmData));
                        } else {
                            localStorage.setItem('firmSetting', JSON.stringify(vm.firmData));
                        }

                    }, function (error) {
                        // Bug#9008 - hide notification error for superadmin role
                        if (!(localStorage.getItem('userRole') == "LexviasuperAdmin")) {
                            notificationService.error("Unable to fetch masterData!");
                        }

                    });
                } else {
                    vm.firmData = emailSettings;
                    if (vm.firmData && vm.firmData.API == "JAVA") {
                        /**
                         * Get email indexbox for providing email notification count
                         */
                        mailboxDataServiceV2.getInboxList(1, 0, 'desc')
                            .then(function (repsonse) {
                                console.log("Java Inbox email for providing notification count!");
                            }, function (error) {
                                console.log("Unable to load java inbox email for providing notification count!");
                            })
                    }
                }



            })();

            vm.toggled = function () {
                $('#myCarousel').carousel({
                    interval: 2000,
                    cycle: true
                });
            }

            $rootScope.$on('updatereferralIcon', function (updatereferralIconevent) {
                var role = masterData.getUserRole();
                if ((role.role == globalConstants.adminrole) && (role.firm_id === null)) {

                } else {
                    getSubscriptionInfo();
                }
            });

            function isActive(tab, stateName) {
                var hasAccess = true;
                var msg = "You do not have access to this application. Please contact your SMP/Administrator to get access.";
                switch (tab) {
                    case 'DA':
                        if ($rootScope.isUserDigiArchivalSub) {
                            $state.go('archival');
                        } else {
                            hasAccess = false;
                        }
                        break;
                    case 'RE':
                        if ($rootScope.isUserReferalActive) {
                            $state.go('referred-matters');
                        } else {
                            hasAccess = false;
                        }
                        break;
                    case 'IM':
                        if ($rootScope.isUserIntakeActive) {
                            $state.go(stateName);
                        } else {
                            hasAccess = false;
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

            $rootScope.$on('notificationCountReset', function (e) {
                vm.totalCount = 0;
            });

            $rootScope.$on('clearAllNotificationsFromBellIcon', function (e) {
                notificationDatalayer.setUserFirstReadTime()
                    .then(function (res) {
                        vm.totalCount = 0;
                });
            });

            $rootScope.$on('notificationToastViewed', function (e, rec, fromToast) {
                if (fromToast && vm.totalCount > 0) {
                    vm.totalCount--;
                }
                _.forEach(vm.notificationList, function (item) {
                    if (item.notification_id == rec.notification_id) {
                        item.is_seen = 1;
                    }
                });
            });

            $rootScope.$on('closeBell', function () {
                $("#notification-bell-menu").css("display", "none");
                $scope.hideNoti = true;
            });

            $rootScope.$on('dismissNotiFromHeader', function (e, rec) {
                if (rec) {
                    _.forEach(rec, function (item) {
                        vm.notificationList = _.filter(vm.notificationList, function (v) {
                            return item != v.notification_id;
                        });
                    });
                }
            });

            $rootScope.$on('readNotiFromHeader', function (e, rec) {
                _.forEach(vm.notificationList, function (item) {
                    if (item.notification_id == rec.notification_id) {
                        item.is_seen = 1;
                    }
                });
            });

            $rootScope.$on('getNotificationCountData', function (event, args) {
                getNotificationCountData();
            })

            function getNotificationCountData() {
                var place = '';
                var placeArr = [1, 2, 3, 4, 5, 6, 7, 8];
                var lookIn = 2;
                // if ($rootScope.isIntakeActive == 0) {
                //     lookIn = 0;
                // }

                if ($rootScope.isSmsActive == 0) {
                    placeArr = _.filter(placeArr, function (n) {
                        return n != 5;
                    });
                }
                if (vm.isEmailSubscribed == 0) {
                    placeArr = _.filter(placeArr, function (n) {
                        return n != 4;
                    });
                }
                place = utils.getLocation(placeArr).join(',');

                if (gracePeriodDetails.firm_id === null) {

                } else {
                    notificationDatalayer.newNotifications(lookIn, 0, 0, place, 1, 20, true)
                        .then(function (res) {
                            vm.totalCount = res.totalCount;
                            vm.notificationList = _.uniq(res.result, function (rec) { return rec.notification_id });
                        });
                }

            }

            $rootScope.$on('updateSidebarCount', function (event, args) { //Bug#7043:update count on notification
            })
            $rootScope.$on('updateTaskCount', function (event, args) {
            })
            $rootScope.$on('updateEventCount', function (event, args) {
            })
            $rootScope.$on('updateEmailCount', function (event, args) {
            })
            $rootScope.$on('updateReminderCount', function (event, args) {
            })
            $rootScope.$on('updateDocCount', function (event, args) {
            })
            $rootScope.$on('updatetwoWayTextCount', function (event, args) {
            })

            if ($rootScope.connection && globalConstants.useSignalr) {
                $rootScope.connection.on("newMessage", function (data) {
                    console.log("signalR message received!");
                    // Need to refresh page for below notification_type :
                    var refreshNotificationFor = [
                        "Refresh"
                    ];

                    var uId = localStorage.getItem('userId');

                    if (_.indexOf(refreshNotificationFor, data.sender) > -1) {
                        if ($state.current.name == 'allnotifications') {
                            $rootScope.$broadcast("getLatestNotifications");
                        } else {
                            getNotificationCountData();
                        }
                    } else {
                        if (uId == data.recipient) {
                            var resultNotification = utils.processNotification([data.text])[0];
                            if (resultNotification.is_intake == 1 && $rootScope.isIntakeActive == 0) {
                                //ignore
                            } else if (resultNotification.notification_type == "Client_Messenger" && $rootScope.isSmsActive == 0) {
                                //ignore
                            } else if (vm.isEmailSubscribed == 0 && resultNotification.notification_type == "Email") {
                                //ignore
                            } else {
                                $scope.$apply(function () {
                                    
                                    resultNotification.is_seen = 0;
                                    if (!vm.notificationList) {
                                        vm.notificationList = [];
                                    }
                                    var existingNoti = _.findWhere(vm.notificationList, { notification_id: resultNotification.notification_id });
                                    if (!existingNoti) {
                                        vm.notificationList.unshift(resultNotification);
                                         vm.totalCount += 1;
                                    } 
                                    var tInstance = showToast(resultNotification);
                                    if ($state.current.name == 'allnotifications') {
                                        resultNotification.toast = tInstance;
                                        $rootScope.$broadcast("addNotification", resultNotification);
                                    }
                                });
                            }
                        }
                    }
                });
            }

            function showToast(data) {
                return toaster.pop({
                    type: 'info',//success
                    title: 'Notification',
                    showCloseButton: true,
                    body: 'toast-html',
                    bodyOutputType: 'directive',
                    directiveData: data,
                    onHideCallback: function () {
                        // if ($state.current.name == 'allnotifications') {
                        //     vm.totalCount = 0;
                        // } else {
                        //     vm.totalCount -= 1;
                        // }
                    }
                });
            }

            vm.breadcrums = [];

            vm.stateChange = function () {
                if (vm.hideSettings) {
                    return;
                }
                var stateName = $rootScope.onMatter == true ? "dashboard.analytics" : $state.current.name;
                if ($rootScope.onLauncher == true) {
                    stateName = 'launcher';
                }
                if ($rootScope.onMarkerplace == true) {
                    stateName = 'marketplace.applications';
                }
                if ($rootScope.onReferral == true) {
                    stateName = 'referred-matters';
                }
                if ($rootScope.onArchival == true) {
                    stateName = 'archival';
                }
                if ($rootScope.onIntake == true) {
                    stateName = 'intakedashboard.analytics';
                }

                if ($rootScope.onExpense == true) {
                    stateName = 'expenseManager';
                }
                if ($rootScope.onReferralPrg == true) {
                    stateName = 'referral-Program';
                }

                $state.go(stateName);
            };

            if ($rootScope.onMatter == true) {
                vm.others = [
                    { name: 'Matters', state: 'matter-list' },
                    { name: 'Contacts', state: 'globalContact' },
                    { name: 'Documents', state: 'documents' },
                    { name: 'Reports', state: 'report.allMatterListReport' }
                ];
            } else {
                vm.others = [
                    { name: 'Intake', state: 'intake-list' },
                    { name: 'Contacts', state: 'intakeglobalContact' },
                    { name: 'Reports', state: 'intakereport.allIntakeListReport' }
                ];
            }



            vm.highlightReferredOption = highlightReferredOption;
            vm.routeFromBreadcrum = routeFromBreadcrum;

            function highlightReferredOption() {
                return $state.current.name === 'referred-matters';
            }

            function routeFromBreadcrum(breadcrum) {
                if (utils.isEmptyVal(breadcrum.state)) {
                    return;
                }

                (breadcrum.state != 'settings.workflows') ? $state.go(breadcrum.state, breadcrum.param) : $state.go(breadcrum.state, breadcrum.param);
                if (breadcrum.state == 'settings.workflows') {
                    $rootScope.viewWorkflowflag = false;
                    //set breadcrumb for workflow tab in settings    
                    workflowHelper.setWorkflowBreadCrum('Settings', breadcrum.state,
                        breadcrum.param);
                } else if (breadcrum.state == 'workflow') {
                    $rootScope.$broadcast("matterWorkFlowViewChanged")
                } else if (breadcrum.state == 'intakeworkflow') {
                    $rootScope.$broadcast("intakeWorkFlowViewChanged")
                }
            }

            // US#4228 modal popup added  ....Start
            vm.openNotification = function (goToTab) {
                goToTab = utils.isEmptyVal(goToTab) ? "" : goToTab;
                localStorage.setItem("notificationTab", goToTab);
                var modalInstance = $modal.open({
                    templateUrl: 'app//notification/notification.html',
                    controller: 'NotificationCtrl as notif',
                    windowClass: 'modalXLargeDialog',

                });
            }
            // ....End 


            function getSubscriptionInfo() {
                var response = practiceAndBillingDataLayer.getConfigurableData();
                response.then(function (data) {
                    vm.isReferralExchange = data.RE.is_active;
                    vm.isDigiArchivalSub = data.DA.is_active;
                    $rootScope.isExceseManagerSub = data.EM.is_active;
                    var resData = data.matter_apps;
                    if (angular.isDefined(resData) && resData != '' && resData != ' ') {
                        $rootScope.is_workflow_active = (resData.workflow == 1) ? true : false;
                    } else {
                        $rootScope.is_workflow_active = false;
                    }
                });
            }

            // US#4228 modal popup added  ....Start
            vm.openNotification = function (goToTab) {
                if (goToTab == "sidebar") {
                    sessionStorage.setItem('fromNotificationtab', true);
                }
                goToTab = utils.isEmptyVal(goToTab) ? "" : goToTab;
                localStorage.setItem("notificationTab", goToTab);
                var modalInstance = $modal.open({
                    templateUrl: 'app//notification/notification.html',
                    controller: 'NotificationCtrl as notif',
                    windowClass: 'modalXLargeDialog'
                });
            }
            vm.openhelp = function (goToTab) {
                var ts = Math.floor((new Date()).getTime());
                var firstname = localStorage.getItem('user_fname');
                var lastname = localStorage.getItem('user_lname');
                var email = localStorage.getItem('user_email'); // registered email id of the user who login
                ts = ts - 10000;

                var postData = {
                    "user_name": email,
                    "time_stamp": ts,
                    "full_name": firstname + " " + lastname,
                    "login_name": firstname.replace(/\s/g, '')
                };

                var url = globalConstants.zohoSignUp1;
                $http.post(url, postData)
                    .then(function (response) {
                        var obj1 = response.data;
                        window.open(obj1.redirectURL, '_blank');
                    }, function (error) { });
            }
            // ....End 
            vm.stateName = '';
            $scope.$watch(function () {
                return routeManager.getBreadcrums();
            }, function (newBreadcrum) {
                if ($rootScope.onMatter == true) {
                    vm.others = [
                        { name: 'Matters', state: 'matter-list' },
                        { name: 'Contacts', state: 'globalContact' },
                        { name: 'Documents', state: 'documents' },
                        { name: 'Reports', state: 'report.allMatterListReport' }
                    ];
                } else {
                    vm.others = [
                        { name: 'Intakes', state: 'intake-list' },
                        { name: 'Contacts', state: 'intakeglobalContact' },
                        { name: 'Reports', state: 'intakereport.allIntakeListReport' }
                    ];
                }
                vm.breadcrums = utils.isEmptyVal(newBreadcrum) ? [] : newBreadcrum;
                if ($rootScope.onIntake == true) {
                    $scope.appName = "Intake Manager";
                    vm.stateName = "#/intake/dashboard";
                } else if ($rootScope.onLauncher == true) {
                    $scope.appName = "LaunchPad";
                    vm.stateName = "#/launcher";
                } else if ($rootScope.onMatter == true) {
                    $scope.appName = "Matter Manager";
                    vm.stateName = "#/dashboard";
                } else if ($rootScope.onReferral == true) {
                    $scope.appName = "Referral Engine";
                    vm.stateName = "#/referred-matters";
                } else if ($rootScope.onArchival == true) {
                    $scope.appName = "Digital Archiver";
                    vm.stateName = "#/archival";
                } else if ($rootScope.onMarkerplace == true) {
                    $scope.appName = "Marketplace";
                    vm.stateName = "#/marketplace";
                } else if ($rootScope.onContactManager == true) {
                    $scope.appName = "Contact Manager";
                    vm.stateName = "#/launcher/contacts";
                } else if ($rootScope.onExpense == true) {
                    $scope.appName = "Expense Manager";
                    vm.stateName = "#/expenseManager";
                }
                else if ($rootScope.onReferralPrg == true) {
                    $scope.appName = "Client Referral Program";
                    vm.stateName = "#/referral-program";
                }
                else if ($rootScope.onNotifications == true) {
                    $scope.appName = "Cloudlex";
                    vm.stateName = "#/notifications";
                }
                else {
                    if ($state.current.name.indexOf("settings.profile") > -1 ||
                        $state.current.name.indexOf("settings.practice") > -1 ||
                        $state.current.name.indexOf("settings.userManagement") > -1 ||
                        $state.current.name.indexOf("settings.subscription") > -1 ||
                        $state.current.name.indexOf("settings.configuration") > -1) {
                        var launchpad = JSON.parse(localStorage.getItem('launchpadSetting'));
                        if (launchpad && launchpad.enabled != 1) {
                            $scope.appName = "Matter Manager";
                            vm.stateName = "#/dashboard";
                        } else {
                            $scope.appName = "Cloudlex";
                            vm.stateName = "#/settings";
                        }
                    }
                }
            });

        }
    ]);