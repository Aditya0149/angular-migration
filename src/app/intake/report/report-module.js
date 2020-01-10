(function () {
    'use strict';

    angular.module('intake.report', [])

        .config(['$stateProvider', function ($stateProvider) {
            $stateProvider
                .state('intakereport', {
                    url: '/intake/report',
                    abstract: true,
                    templateUrl: 'app/intake/report/report.html',
                    controller: 'IntakeReportCtrl as intakeReportCtrl',
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
                    }
                })
                .state('intakereport.allIntakeListReport', {
                    url: '',
                    templateUrl: 'app/intake/report/allIntakeList/allIntakeListReport.html',

                    controller: 'AllIntakeListReportCtrl as allIntakeListReportCtrl',
                    breadcrum: [{ name: 'Reports' }, { name: 'All Intake List' }],
                    resolve: {
                        'RoleData': ['masterData', function (masterData) {
                            var role = masterData.getUserRole();
                            if (utils.isEmptyObj(role)) {
                                return masterData.fetchUserRole();
                            }
                            return role;
                        }]
                    },
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = false;
                        $rootScope.onIntake = true;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    }
                })
                .state('intakereport.intakeUpcomingSOLs', {
                    url: '/upcomingSOLs',
                    templateUrl: 'app/intake/report/allIntakeList/upcomingSOLs.html',

                    controller: 'IntakeUpcomingSOLsCtrl as intakeupcomingSOLsCtrl',
                    breadcrum: [{ name: 'Reports' }, { name: 'Upcoming SOLs' }],
                    resolve: {
                        'RoleData': ['masterData', function (masterData) {
                            var role = masterData.getUserRole();
                            if (utils.isEmptyObj(role)) {
                                return masterData.fetchUserRole();
                            }
                            return role;
                        }]
                    },
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = false;
                        $rootScope.onIntake = true;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    }
                }).state('intakereport.intakeUpcomingNOCs', {
                    url: '/upcomingNOCs',
                    templateUrl: 'app/intake/report/allIntakeList/upcomingNOCs.html',

                    controller: 'IntakeupcomingNOCsCtrl as intakeupcomingNOCsCtrl',
                    breadcrum: [{ name: 'Reports' }, { name: 'Upcoming NOCs' }],
                    resolve: {
                        'RoleData': ['masterData', function (masterData) {
                            var role = masterData.getUserRole();
                            if (utils.isEmptyObj(role)) {
                                return masterData.fetchUserRole();
                            }
                            return role;
                        }]
                    },
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = false;
                        $rootScope.onIntake = true;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    }
                }).state('intakereport.intakeValuation', {
                    url: '/intakeValuation',
                    templateUrl: 'app/intake/report/allIntakeList/intake-valuation.html',
                    controller: 'IntakeValuationCtrl as intakeValuationCtrl',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    },
                    breadcrum: [{ name: 'Reports' }, { name: 'Intake Valuation Report' }],
                    onEnter: function ($rootScope, masterData, $state) {
                        var data = masterData.getMasterData();
                        if (!utils.isEmptyObj(data)) {
                            var userRole = masterData.getUserRole();
                            if (userRole.is_admin == '1' || userRole.role == 'Managing Partner/Attorney' || userRole.role == 'LexviasuperAdmin') {

                            }
                            else {
                                $state.go('intakereport.allIntakeListReport');
                            }
                        }
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = false;
                        $rootScope.onIntake = true;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    }

                }).state('intakereport.intakeCampaignReport', {
                    url: '/intakeCampaignReport',
                    templateUrl: 'app/intake/report/allIntakeList/intake-campaign.html',

                    controller: 'IntakeCampaignReportCtrl as intakeCampaignReportCtrl',
                    breadcrum: [{ name: 'Reports' }, { name: 'Intake Campaign Report' }],
                    resolve: {
                        'RoleData': ['masterData', function (masterData) {
                            var role = masterData.getUserRole();
                            if (utils.isEmptyObj(role)) {
                                return masterData.fetchUserRole();
                            }
                            return role;
                        }]
                    },
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = false;
                        $rootScope.onIntake = true;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    }
                }).state('intakereport.intakeStateAndVenue', {
                    url: '/intakeStateAndVenue',
                    templateUrl: 'app/intake/report/venue/venue-report.html',

                    controller: 'IntakeVenueReportCtrl as IntakeVenueReportCtrl',
                    breadcrum: [{ name: 'Reports' }, { name: 'State And Venue Report' }],
                    resolve: {
                        'RoleData': ['masterData', function (masterData) {
                            var role = masterData.getUserRole();
                            if (utils.isEmptyObj(role)) {
                                return masterData.fetchUserRole();
                            }
                            return role;
                        }]
                    },
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = false;
                        $rootScope.onIntake = true;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    }
                }).state('intakereport.intakeTaskSummary', {
                    url: '/intakeTaskSummary',
                    templateUrl: 'app/intake/report/taskSummary/taskSummary-report.html',
                    controller: 'IntakeTaskSummaryReportCtrl as intakeTaskSummaryCtrl',
                    breadcrum: [{ name: 'Reports' }, { name: 'Task Summary' }],
                    resolve: {
                        'RoleData': ['masterData', function (masterData) {
                            var role = masterData.getUserRole();
                            if (utils.isEmptyObj(role)) {
                                return masterData.fetchUserRole();
                            }
                            return role;
                        }]
                    },
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = false;
                        $rootScope.onIntake = true;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    }
                });
        }]).value('MyTree', [
            {
                "id": 1, "title": 'Matter', entity: 'MS', isSelected: true,

                "items": [
                    { "id": 11, "title": 'Matter Summary', entity: 'MS', isSelected: true },
                ]
            },

            {
                "id": 2, "title": 'All Parties', entity: 'AP', isSelected: true,

                "items": [
                    { "id": 21, "title": 'Plaintiff Note', entity: 'PN', isSelected: true },
                    { "id": 22, "title": 'Defendant Note', entity: 'DN', isSelected: true },
                    { "id": 23, "title": 'Other Parties Note', entity: 'ON', isSelected: true },
                ]
            },
            {
                "id": 3, "title": 'Details', entity: 'D', isSelected: true,
                "items": [{
                    "id": 31, "title": 'Negligence-Liability', entity: 'NL', isSelected: true,
                    "items": [
                        {
                            "id": 311, "title": 'Negligence-Liability Description', entity: 'ND', isSelected: true
                        },
                        {
                            "id": 312, "title": 'Property Damage Details', entity: 'PD', isSelected: true
                        }
                    ]
                },
                {
                    "id": 32, "title": 'Medical Information', entity: 'MI', isSelected: true,
                    "items": [
                        { "id": 321, "title": 'Plaintiff bodily injury', entity: 'PI', isSelected: true },
                        { "id": 322, "title": 'Memo', entity: 'MM', isSelected: true },
                    ]
                },
                {
                    "id": 33, "title": 'Medical Bill', entity: 'BM', isSelected: true,
                    "items": [
                        { "id": 331, "title": 'Memo', entity: 'BM', isSelected: true },
                    ]
                },
                {
                    "id": 34, "title": 'Insurance', entity: 'IM', isSelected: true,
                    "items": [
                        { "id": 341, "title": 'Memo', entity: 'IM', isSelected: true },
                    ]
                },
                {
                    "id": 35, "title": 'Liens', entity: 'LM', isSelected: true,
                    "items": [
                        { "id": 351, "title": 'Memo', entity: 'LM', isSelected: true },
                    ]
                },
                {
                    "id": 36, "title": 'Expenses', entity: 'EM', isSelected: true,
                    "items": [
                        { "id": 361, "title": 'Memo', entity: 'EM', isSelected: true },
                    ]
                },
                {
                    "id": 37, "title": 'Settlement', entity: 'PM', isSelected: true,
                    "items": [
                        { "id": 371, "title": 'Payment details Memo', entity: 'PM', isSelected: true },
                    ]
                }
                ],
            },
            {
                "id": 4, "title": 'Notes', entity: 'MN', isSelected: true
            },
            {
                "id": 5, "title": 'All Document Memos', entity: 'DM', isSelected: true
            }


        ]);

})();
