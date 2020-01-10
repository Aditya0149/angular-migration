(function() {

    'use strict';

    angular
        .module('cloudlex.settings')
        .controller('PlanSelectionCtrl', PlanSelectionCtrl);

    PlanSelectionCtrl.$inject = ['practiceAndBillingDataLayer', '$modal', 'masterData', 'routeManager', 'notification-service', 'applicationsDataLayer', '$rootScope', '$scope', 'launcherDatalayer', '$state'];

    function PlanSelectionCtrl(practiceAndBillingDataLayer, $modal, masterData, routeManager, notificationService, applicationsDataLayer, $rootScope, $scope, launcherDatalayer, $state) {
        var vm = this

        vm.currentPlanInfo = {};
        vm.info = {};
        vm.freePlanFlag = false;
        vm.highlightSelfStarterFlag = false;
        vm.highlightRisingStarFlag = false;
        vm.highlightEliteFlag = false;
        vm.highlightTop100Flag = false;
        vm.getConfigurableData = getConfigurableData;
        vm.unSubscribe = unSubscribe;
        vm.close = close;
        vm.save = save;
        vm.unSubApplications = unSubApplications;
        vm.selectedPlan;
        var gracePeriodDetails = masterData.getUserRole();
        vm.userRoleObj = angular.copy(gracePeriodDetails);
        vm.dissableSubscribe = (gracePeriodDetails.is_admin == 1) || gracePeriodDetails.role == "LexviasuperAdmin" ? true : false;
        vm.launchpad = JSON.parse(localStorage.getItem('launchpadSetting'));
        vm.launchpadAccess = (vm.launchpad.enabled == 1) ? true : false;
        vm.getPlanDetails = getPlanDetails;
        vm.navigateToApp = navigateToApp;
        vm.allfirmData = JSON.parse(localStorage.getItem('allFirmSetting'));
        vm.date = moment().format("MMMM YYYY");
        vm.isSMSEnables = false;
        _.forEach(vm.allfirmData, function(item) {
            if (item.state == "SMS") {
                vm.isSMSEnables = (item.enabled == 1) ? true : false;
            }
        });
        (function() {
            getPackageSubscriptionDetails();
            getConfigurableData();
            setBreadcrum();
            setHighlight();
            persistdata();
        })();

        /**
         * Code to Disabled button for first time
         */
        vm.flag = true;
        vm.forEnabledSaveButton = forEnabledSaveButton;

        function forEnabledSaveButton() {
            $scope.$watch(
                function() {
                    return vm.info;
                },
                function(newValue, oldValue) {
                    if (!angular.equals(oldValue, newValue)) {
                        vm.flag = false;
                    }
                },
                true);
        }

        /**
         * close modal 
         */
        function close(data) {
            data.is_active = true;
            $modalInstance.dismiss('cancel');
        }

        function setBreadcrum() {
            var initCrum = [{ name: '...' }, { name: 'Settings' }, { name: 'Configuration' }];
            routeManager.setBreadcrum(initCrum);
        }

        function setHighlight() {
            vm.highlightSelfStarter = "plan";
            vm.highlightRisingStar = "plan";
            vm.highlightElite = "plan";
            vm.highlightTop100 = "plan";
        }

        function persistdata() {
            _.forEach(vm.active_plan, function(data) {
                if ((data.level == vm.currentPlanInfo[0].level && data.mode == vm.currentPlanInfo[0].mode)) {
                    vm.selectedPlan = data;
                    // vm.usedMatterCases = vm.selectedPlan.max_users / 
                    if (data.name == "Free") {
                        vm.freePlanFlag = true;

                    } else if (data.name == "Self Starter") {
                        vm.highlightSelfStarter = "plan plan-selected";
                        vm.highlightSelfStarterFlag = true;
                    } else if (data.name == "The Rising Star") {
                        vm.highlightRisingStar = "plan plan-selected";
                        vm.highlightRisingStarFlag = true;
                    } else if (data.name == "Elite") {
                        vm.highlightElite = "plan plan-selected";
                        vm.highlightEliteFlag = true;
                    } else if (data.name == "Top 100") {
                        vm.highlightTop100 = "plan plan-selected";
                        vm.highlightTop100Flag = true;
                    }
                }

                vm.renewalDate = moment.unix(vm.currentPlanInfo[0].end_subscription_date).format('MM/DD/YYYY');
            });
        }



        function getPackageSubscriptionDetails() {
            var response = practiceAndBillingDataLayer.getPackageSubscripDetails();
            response.then(function(response) {
                vm.planDetails = response;
                if (vm.planDetails.sms && vm.planDetails.sms.current_sms_plan && vm.planDetails.sms.current_sms_plan.length > 0) {
                    vm.tooltipForSMSApplication = 'Your subscription is valid till ' + moment.unix(vm.planDetails.sms.current_sms_plan[0].sub_end_date).format('MM/DD/YYYY');
                }
                if (vm.planDetails.intake && vm.planDetails.intake.current_intake_plan && vm.planDetails.intake.current_intake_plan.length > 0) {
                    vm.tooltipForIntakeApplication = '';
                    // vm.tooltipForIntakeApplication = 'Your subscription is valid till ' + moment.unix(vm.planDetails.intake.current_intake_plan[0].sub_end_date).format('MM/DD/YYYY');
                }
                var data = angular.copy(response.matter)
                if (angular.isDefined(data) && data != '' && data != ' ') {

                    vm.active_user_count = parseInt(data.active_user_count);
                    vm.max_users_count = parseInt(data.max_users_count);

                    vm.max_cases_count = data.max_cases_count;
                    vm.total_matter_count = data.total_matter_count;

                    vm.currentPlanInfo = data.current_plan;
                    vm.active_plan = data.active_plan;

                    _.forEach(data.active_plan, function(data) {
                        //free plan
                        if (data.level == 5 && data.mode == "M") {
                            vm.level_5_MonthlyInfo = data;
                        }

                        // Self Starter plan
                        if (data.level == 10 && data.mode == "M") {
                            vm.level_10_MonthlyInfo = data;
                        } else if (data.level == 10 && data.mode == "Y") {
                            vm.level_10_YearlyInfo = data;
                        }

                        // plan The Rising Star  
                        if (data.level == 11 && data.mode == "M") {
                            vm.level_11_MonthlyInfo = data;
                        } else if (data.level == 11 && data.mode == "Y") {
                            vm.level_11_YearlyInfo = data;
                        }

                        //plan Elite
                        if (data.level == 12 && data.mode == "M") {
                            vm.level_12_MonthlyInfo = data;
                        } else if (data.level == 12 && data.mode == "Y") {
                            vm.level_12_YearlyInfo = data;
                        }

                        // Top 100 plan 
                        if (data.level == 13 && data.mode == "Y") {
                            vm.level_13_YearlyInfo = data;
                        }
                    });
                    persistdata();
                }
            });
        }

        function navigateToApp(selected) {
            switch (selected) {
                case "CCOM":
                    $state.go('c-com-details');
                    localStorage.setItem("state", 'Client Communicator');
                    localStorage.setItem("selectedType", "CCOM");
                    break;
                case "RE":
                    $state.go('referral-details');
                    localStorage.setItem("state", 'Referral Engine');
                    localStorage.setItem("selectedType", "RE");
                    break;
                case "DA":
                    $state.go('digatl-archival-details');
                    localStorage.setItem("state", 'Digital Archiver');
                    localStorage.setItem("selectedType", "DA");
                    break;
                case "IT":
                    $state.go('Integration-tools-details');
                    localStorage.setItem("state", 'App Integrator');
                    localStorage.setItem("selectedType", "IT");
                    break;
                case "OPLG":
                    $state.go('word-plugin-details');
                    localStorage.setItem("state", 'Word Connector');
                    localStorage.setItem("selectedType", "OPLG");
                    break;
                case "OTLG":
                    $state.go('outlook-plugin-details');
                    localStorage.setItem("state", 'Email Connector');
                    localStorage.setItem("selectedType", "OTLG");
                    break;
                case "GA":
                    $state.go('gmail-plugin-details');
                    localStorage.setItem("state", 'Email Connector');
                    localStorage.setItem("selectedType", "GA");
                    break;
                case "O365":
                    $state.go('office-online-details');
                    localStorage.setItem("state", 'Microsoft Office Online');
                    localStorage.setItem("selectedType", "0365");
                    break;
                case "IM":
                    $state.go('intake-manager-details');
                    localStorage.setItem("state", 'Intake Manager');
                    localStorage.setItem("selectedType", "IM");
                    break;
                case "SMS":
                    $state.go('sms-details');
                    localStorage.setItem("state", 'Client Messenger');
                    localStorage.setItem("selectedType", "SMS");
                    break;
                case "LG":
                    $state.go('lead-generator');
                    localStorage.setItem("state", 'Lead Generator');
                    localStorage.setItem("selectedType", "LG");
                    break;
                case "EM":
                    $state.go('expense-manager');
                    localStorage.setItem("state", 'Expense Manager');
                    localStorage.setItem("selectedType", "EM");
                    break;

            }

        }

        function unSubApplications(data, e) {
            e.stopPropagation();
            var modalInstance = $modal.open({
                templateUrl: 'app/settings/planSelection/confirmation-modal.html',
                controller: 'ConfirmationModalCtrl as confirmationModalCtrl',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    isConfirmInfo: function() {
                        return data;
                    }
                }
            });

            modalInstance.result.then(function(response) {
                launcherDatalayer.getAppAccess().then(function(response) {
                    vm.appList = response.user_permission;
                    $rootScope.isDigiArchivalSub = checkIfAppActive("DA");
                    $rootScope.isReferalActive = checkIfAppActive("RE");
                    $rootScope.isIntakeActive = checkIfAppActive("IM");
                    $rootScope.isExpenseActive = checkIfAppActive("EM");

                    $rootScope.isDigiArchivalSubUI = checkIfAppActive("DA");
                    $rootScope.isReferalActiveUI = checkIfAppActive("RE");
                    $rootScope.isIntakeActiveUI = checkIfAppActive("IM");
                    $rootScope.isExpenseActiveUI = checkIfAppActive("EM");

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
                    resetafterunSubApplication();
                });

            }, function() {

            });
        }

        function buildAppList(data) {
            var keys = [];
            _.each(data, function(val, key) {
                if (val) {
                    keys.push(key);
                }
            });
            vm.applicationlist = [];
            _.each(keys, function(val) {
                if (val != "matter_apps")
                    vm.applicationlist.push(data[val]);
            });
            var emailconnector_isactive = 0;
            if (data.GA.is_active == 1 && data.OTLG.is_active == 1) {
                emailconnector_isactive = 1;
            } else {
                emailconnector_isactive = 0;
            }
            var emailobject = { 'app_order': 100, 'app_code': "EC", 'name': "Email Connector", 'is_active': emailconnector_isactive, permission: { V: 1 }, is_visible: '1' };
            vm.applicationlist.push(emailobject);
            _.forEach(vm.applicationlist, function(item) {
                item.isactive = item.is_active;
            });
            vm.applicationlist = _.sortBy(vm.applicationlist, "name");
            var appPermissions2 = _.filter(vm.applicationlist, function(entity) {
                if (entity.is_active == 1 && entity.is_visible == 1 && entity.permission.V == 1 &&
                    entity.app_code != "IT" && entity.app_code != "GA") {
                    return entity;
                }
            });
            var intakeIndex = _.findIndex(appPermissions2, {
                app_code: 'IM'
            });
            vm.intakeOdd = false;
            if (intakeIndex) {
                intakeIndex++;
                if (intakeIndex % 2 == 0) {
                    vm.intakeOdd = false;
                } else {
                    vm.intakeOdd = true;
                }
            }
            vm.noData = true;
            _.each(keys, function(val) {
                if (vm.noData)
                    if (val != "matter_apps" && val != "IT")
                        if (data[val].is_active == 1 && data[val].permission.V == 1 && data[val].is_visible == 1) {
                            if (val == "IM" || val == "CCOM") {
                                if (vm.launchpad.enabled == 1) {
                                    vm.applicationcount = 1;
                                    vm.noData = false;
                                }
                            } else {
                                vm.applicationcount = 1;
                                vm.noData = false;
                            }
                        }
            });

        }

        function resetafterunSubApplication() {
            vm.applicationcount = 0;
            var response = practiceAndBillingDataLayer.getConfigurableData();
            response.then(function(data) {
                buildAppList(data);
                vm.applicationsInfo = data;
            });
        }

        function checkIfAppActive(appKey) {
            var appPermissions = _.filter(vm.appList, function(entity) {
                if (entity.app_code == appKey) {
                    return entity;
                }
            });
            if (appPermissions && appPermissions.length > 0) {
                return appPermissions[0].is_active == 1 && appPermissions[0].permission == 1 ? 1 : 0
            } else {
                return 0;
            }
        }

        function unSubscribe(data) {
            //confirm before Retrieve matter
            var postDataObj = {
                application_id: data.id,
                status: data.is_active == false ? 0 : 1
            }
            var response = applicationsDataLayer.saveProfileData(postDataObj);
            response.then(function(data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    //getConfiguredData();
                    data.is_active = false;
                    notificationService.success('You have unsubscribed Successfully');
                    $modalInstance.dismiss('cancel');
                }
            }, function(error) {
                data.is_active = true;
                notificationService.error(error.data[0]);
            });
        }

        function getPlanDetails(e, isSMS) {
            e.stopPropagation();
            var modalInstance = $modal.open({
                templateUrl: 'app/marketplace/subscription/subscription.html',
                controller: 'SubscriptionCtrl as subscriptionCtrl',
                windowClass: 'middle-pop-up',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    data: function() {
                        return {
                            isSMS: isSMS ? true : false,
                            isIntake: isSMS ? false : true,
                            isDigiArchival: false,
                            isReferralExchange: false
                        }
                    },
                    isPlanChange: function() {
                        return true;
                    },
                    appName: function() {
                        return isSMS ? 'Client Messenger' : 'Intake';
                    }
                }
            });
            modalInstance.result.then(function(data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    notificationService.success('Thank you! We will contact you soon.');
                    getPackageSubscriptionDetails();
                }

            }, function(error) {
                error ? notificationService.error(error.data[0]) : angular.noop();
            });
        }

        function getConfigurableData() {
            vm.applicationcount = 0;
            var response = practiceAndBillingDataLayer.getConfigurableData();
            response.then(function(data) {
                vm.applicationsInfo = data;
                buildAppList(data);
                var resData = data.matter_apps;
                if (angular.isDefined(resData) && resData != '' && resData != ' ') {
                    vm.info.is_googleDrive = (resData.google_drive == 1) ? true : false;
                    vm.info.is_dropBox = (resData.dropbox == 1) ? true : false;
                    vm.info.is_onedrive = (resData.onedrive == 1) ? true : false;
                    // US:16596 DocuSign
                    vm.info.is_docusign = (resData.docusign == 1) ? true : false;
                    vm.info.is_googleCalender = (resData.google_calendar == 1) ? true : false;
                    vm.info.is_Ical = (resData.icalendar == 1) ? true : 0;
                    vm.info.is_microsoftExchange = (resData.ms_exchange == 1) ? true : false;
                    vm.info.is_emailVCloudlex = (resData.google_mail == 1) ? true : false;
                    vm.info.is_CustomFileNumber = (resData.file_number == 1) ? true : false;
                    vm.info.is_workflow = (resData.workflow == 1) ? true : false;
                    vm.info.is_fax = (resData.fax == 1) ? true : false;
                    vm.info.is_autoTaskCreation = (resData.DefaultTaskCreation == 1) ? true : false;
                }
                forEnabledSaveButton();
            });
        }

        function save(info) {
            var postData = {};
            postData.GoogleDrive = (info.is_googleDrive == true) ? 1 : 0;
            postData.Dropbox = (info.is_dropBox == true) ? 1 : 0;
            postData.OneDrive = (info.is_onedrive == true) ? 1 : 0;
            postData.docusign = (info.is_docusign == true) ? 1 : 0;
            postData.Googlecalendar = (info.is_googleCalender == true) ? 1 : 0;
            postData.icalendar = (info.is_Ical == true) ? 1 : 0;
            postData.MSExchange = (info.is_microsoftExchange == true) ? 1 : 0;
            postData.Googlemail = (info.is_emailVCloudlex == true) ? 1 : 0;
            postData.Filenumber = (info.is_CustomFileNumber == true) ? 1 : 0;
            postData.Workflow = (info.is_workflow == true) ? 1 : 0;
            postData.DefaultTaskCreation = (info.is_autoTaskCreation == true) ? 1 : 0;
            postData.Fax = (info.is_fax == true) ? 1 : 0;

            var response = practiceAndBillingDataLayer.savePackageSubscriptionDetails(postData);
            response.then(function(data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    $rootScope.$emit('updateWorkflowIcons', 'updateWorkFlowIcon');
                    $rootScope.$emit('updateFaxIcons', 'updateFaxIcons');
                    notificationService.success('Configuration Data Saved Successfully');
                    vm.flag = true;
                }
            }, function(error) {
                notificationService.error(error.data[0]);
            });
        }
    }
})();