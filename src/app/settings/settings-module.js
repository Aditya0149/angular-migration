'use strict';

angular.module('cloudlex.settings', [])

    .config(['$stateProvider', function ($stateProvider) {

        $stateProvider
            .state('settings', {
                url: '/settings',
                abstract: true,
                templateUrl: 'app/settings/settings.html',
                controller: 'SettingsCtrl as settings',
                resolve: {
                    'RoleData': ['masterData', function (masterData) {
                        var role = masterData.getUserRole();
                        if (utils.isEmptyObj(role)) {
                            return masterData.fetchUserRole();
                        }
                        return role;
                    }],

                    'MasterData': ['masterData', function (masterData) {
                        var data = masterData.getMasterData();
                        if (utils.isEmptyObj(data)) {
                            return masterData.fetchMasterData();
                        }
                        return data;
                    }]

                },

            })
            .state('settings.profile', {
                url: '',
                templateUrl: 'app/settings/profile/profile.html',
                controller: 'ProfileCtrl as profileCtrl',
                resolve: {
                    'RoleData': ['masterData', function (masterData) {
                        var role = masterData.getUserRole();
                        if (utils.isEmptyObj(role)) {
                            return masterData.fetchUserRole();
                        }
                        return role;
                    }]
                },
            })
            .state('settings.practice', {
                url: '/practice',
                templateUrl: 'app/settings/practiceAndBilling/practice&Billing.html',
                controller: 'PracticeAndBillingCtrl as practiceAndBillingCtrl',
                resolve: {
                    'RoleData': ['masterData', function (masterData) {
                        var role = masterData.getUserRole();
                        if (utils.isEmptyObj(role)) {
                            return masterData.fetchUserRole();
                        }
                        return role;
                    }]
                },
                rolesPermitted: ["Managing Partner/Attorney"]
            })
            .state('settings.userManagement', {
                url: '/user-mgmt',
                templateUrl: 'app/settings/user-management-tab/user-management-tabpage.html',
                controller: 'userManagementTabCtrl as userManagementTabCtrl',
                resolve: {
                    'MasterData': ['masterData', function (masterData) {
                        var data = masterData.getMasterData();
                        if (utils.isEmptyObj(data)) {
                            return masterData.fetchMasterData();
                        }
                        return data;
                    }]
                }
                // rolesPermitted: ["Managing Partner/Attorney","LexviasuperAdmin"]
            })



            .state('settings.subscription', {
                url: '/subscription',
                templateUrl: 'app/settings/subscription/subscriptionNew.html',
                controller: 'SubScriptionCtrl as subscriptionctrl'

            })

            .state('settings.configuration', {
                url: '/configuration',
                templateUrl: 'app/settings/planSelection/configuration-setting.html',
                controller: 'PlanSelectionCtrl as planselectionctrl',
                resolve: {
                    isConfirmInfo: function () {
                        return '';
                    },
                    $modalInstance: function () {
                        return '';
                    }
                }
            })

            .state('settings.notifications', {
                url: '/notifications',
                templateUrl: 'app/settings/notifications/notification-setting.html',
                controller: 'NotificationSelectionCtrl as NotificationSelectionCtrl',
                resolve: {
                   
                }
            })

    }]);
