(function () {
    'use strict';

    angular.module('cloudlex.report', [])

        .config(['$stateProvider', function ($stateProvider) {
            $stateProvider
                .state('report', {
                    url: '/report',
                    abstract: true,
                    templateUrl: 'app/report/report.html',
                    controller: 'ReportCtrl as reportCtrl',
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
                .state('report.allMatterListReport', {
                    url: '',
                    templateUrl: 'app/report/allMatterList/allMatterListReport.html',
                    controller: 'AllMatterListReportCtrl as allMatterListReportCtrl',
                    breadcrum: [{ name: 'Reports' }, { name: 'All Matter Report' }],
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    }
                })
                .state('report.matterInTookByDate', {
                    url: '/matterInTookByDate',
                    templateUrl: 'app/report/allMatterList/matterInTookByDate.html',
                    controller: 'MatterInTookByDateCtrl as matterInTookByDateCtrl',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    },
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    },
                    breadcrum: [{ name: 'Reports' }, { name: 'New Matters Opened by date' }]

                })
                .state('report.matterStatus', {
                    url: '/matterStatus',
                    templateUrl: 'app/report/allMatterList/matterStatus.html',
                    controller: 'MatterStatusCtrl as matterStatusCtrl',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    },
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    },
                    breadcrum: [{ name: 'Reports' }, { name: 'Matter status summary' }]

                })
                .state('report.matterType', {
                    url: '/matterType',
                    templateUrl: 'app/report/allMatterList/matterType.html',
                    controller: 'MatterTypeCtrl as matterTypeCtrl',
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    },
                    breadcrum: [{ name: 'Reports' }, { name: 'Matter type and sub-type summary' }]

                })
                .state('report.upcomingNOCs', {
                    url: '/upcomingNOCs',
                    templateUrl: 'app/report/allMatterList/upcomingNOCs.html',
                    controller: 'UpcomingNOCsCtrl as upcomingNOCsCtrl',
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    },
                    breadcrum: [{ name: 'Reports' }, { name: 'Upcoming NOCs' }]
                })
                .state('report.upcomingSOLs', {
                    url: '/upcomingSOLs',
                    templateUrl: 'app/report/allMatterList/upcomingSOLs.html',
                    controller: 'UpcomingSOLsCtrl as upcomingSOLsCtrl',
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    },
                    breadcrum: [{ name: 'Reports' }, { name: 'Upcoming SOLs' }]

                }).state('report.matterEvents', {
                    url: '/matterEvents',
                    templateUrl: 'app/report/allMatterList/matter-event.html',
                    controller: 'matterEventsCtrl as matterEventsCtrl',
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    },
                    breadcrum: [{ name: 'Reports' }, { name: 'Events Report' }]

                })
                .state('report.matterAge', {
                    url: '/matterAge',
                    templateUrl: 'app/report/matter-age-report/matter-age-report.html',
                    controller: 'MatterAgeCtrl as matterAge',
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    },
                    breadcrum: [{ name: 'Reports' }, { name: 'Matter Status Age' }]

                }).state('report.venue', {
                    url: '/venue',
                    templateUrl: 'app/report/venue/venue-report.html',
                    controller: 'VenueReportCtrl as venue',
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    },
                    breadcrum: [{ name: 'Reports' }, { name: 'Court and Venue' }]

                }).state('report.taskAge', {
                    url: '/taskAge',
                    templateUrl: 'app/report/task-age/task-age.html',
                    controller: 'TaskAgeReportCtrl as taskAge',
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
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    },
                    breadcrum: [{ name: 'Reports' }, { name: 'Task Age' }]


                }).state('report.taskSummary', {
                    url: '/taskSummary',
                    templateUrl: 'app/report/taskSummary/taskSummary-report.html',
                    controller: 'TaskSummaryReportCtrl as taskSummaryCtrl',
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
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    },
                    breadcrum: [{ name: 'Reports' }, { name: 'Task Summary' }]

                }).state('report.documentReport', {
                    url: '/documentReport',
                    templateUrl: 'app/report/document-report/document-report.html',
                    controller: 'DocumentReportCtrl as docReport',
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    },
                    breadcrum: [{ name: 'Reports' }, { name: 'Documents Report' }]

                }).state('report.userActivity', {
                    url: '/userActivity',
                    templateUrl: 'app/report/userActivity/userActivityReport.html',
                    controller: 'UserActivityReportCtrl as userActivityReportCtrl',
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    },
                    breadcrum: [{ name: 'Reports' }, { name: 'User Activity' }]

                }).state('report.contact', {
                    url: '/contact',
                    templateUrl: 'app/report/contact/contact-report.html',
                    controller: 'ContactReportCtrl as contactReportCtrl',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    },
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    },
                    breadcrum: [{ name: 'Reports' }, { name: 'Matter Contact Relationship' }]

                }).
                state('report.expense', {
                    url: '/expense',
                    templateUrl: 'app/report/allMatterList/expense-report.html',
                    controller: 'expenseReportCtrl as expenseReportCtrl',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    },
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    },
                    breadcrum: [{ name: 'Reports' }, { name: 'Expense Report' }]

                }).state('report.settlement', {
                    url: '/settlement',
                    templateUrl: 'app/report/allMatterList/settlement-report.html',
                    controller: 'settlementReportCtrl as settlementReportCtrl',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    },
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    },
                    breadcrum: [{ name: 'Reports' }, { name: 'Settlement Report' }]

                }).state('report.insurance', {
                    url: '/insurance',
                    templateUrl: 'app/report/allMatterList/insuranceReport.html',
                    controller: 'insuranceReportCtrl as insuranceReportCtrl',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    },
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    },
                    breadcrum: [{ name: 'Reports' }, { name: 'Insurance Report' }]
                }).
                state('report.mailingList', {
                    url: '/mailingList',
                    templateUrl: 'app/report/allMatterList/plaintiff-mailing-list.html',
                    controller: 'plaintiffMailingCtrl as plaintiffMailingCtrl',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    },
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    },
                    breadcrum: [{ name: 'Reports' }, { name: 'Plaintiff Contact Report' }]

                }).
                state('report.matterValuation', {
                    url: '/matterValuation',
                    templateUrl: 'app/report/allMatterList/matter-valuation.html',
                    controller: 'matterValuationCtrl as matterValuationCtrl',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    },
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    },
                    breadcrum: [{ name: 'Reports' }, { name: 'Matter Valuation Report' }]

                }).
                state('report.medicalRecordRequest', {
                    url: '/medicalRecordRequest',
                    templateUrl: 'app/report/allMatterList/medicalRecordRequestReport.html',
                    controller: 'medicalRecordRequestCtrl as medicalRecordRequestCtrl',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    },
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    },
                    breadcrum: [{ name: 'Reports' }, { name: 'Medical Record Request Report' }]

                })

                .state('report.motionReport', {
                    url: '/motionReport',
                    templateUrl: 'app/report/motion-report/motion-report.html',
                    controller: 'MotionReportCtrl as motionReport',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    },
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    },
                    breadcrum: [{ name: 'Reports' }, { name: 'Motion Report' }]
                })
                //US#12586
                .state('report.keywordSearch', {
                    url: '/keywordSearch',
                    templateUrl: 'app/report/allMatterList/keywordSearch.html',
                    controller: 'KeywordSearchCtrl as keywordSearch',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    },
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    },
                    breadcrum: [{ name: 'Reports' }, { name: 'Keyword Search Report' }]
                });
        }])
        .value('MyTree', [
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


        ])
        .value('IntakeMyTree', [
            {
                "id": 1, "title": 'Intake', entity: 'INTMT', isSelected: true,

                "items": [
                    { "id": 4, "title": 'Intake Name', entity: 'IN', isSelected: true },
                    { "id": 5, "title": 'Campaign', entity: 'IC', isSelected: true },
                    { "id": 6, "title": 'Location of Incident', entity: 'LI', isSelected: true },
                    { "id": 7, "title": 'Description of incident', entity: 'DI', isSelected: true },
                ]
            },
            {
                "id": 2, "title": 'Details', entity: 'INTD', isSelected: true,
                "items": [{
                    "id": 8, "title": 'Client Details', entity: 'NL', isSelected: true,
                    "items": [
                        {
                            "id": 9, "title": 'Place of birth', entity: 'PB', isSelected: true
                        },
                        {
                            "id": 10, "title": 'Social security no', entity: 'SSN', isSelected: true
                        },
                        {
                            "id": 11, "title": 'Nationality', entity: 'NT', isSelected: true
                        }
                    ]
                },
                {
                    "id": 12, "title": 'Employment and educational details', entity: 'INTEED', isSelected: true,
                    "items": [
                        { "id": 13, "title": 'Occupation', entity: 'OC', isSelected: true },
                        { "id": 14, "title": 'Position', entity: 'PO', isSelected: true },
                        { "id": 15, "title": 'Description', entity: 'DS', isSelected: true },
                        { "id": 16, "title": 'Program', entity: 'PR', isSelected: true },
                    ]
                },
                {
                    "id": 17, "title": 'Incident Details', entity: 'INTIND', isSelected: true,
                    "items": [
                        { "id": 18, "title": 'Road conditions on the date of incident', entity: 'RC', isSelected: true },
                        { "id": 19, "title": 'Street', entity: 'ST', isSelected: true },
                        { "id": 20, "title": 'City/Town', entity: 'CT', isSelected: true },
                        { "id": 21, "title": 'State', entity: 'SE', isSelected: true },
                        { "id": 22, "title": 'Zip Code', entity: 'ZC', isSelected: true },
                        { "id": 23, "title": 'Country', entity: 'CO', isSelected: true },
                        { "id": 24, "title": 'Police Report', entity: 'PRN', isSelected: true },
                        { "id": 25, "title": 'Precinct No', entity: 'PCN', isSelected: true },
                        { "id": 26, "title": 'Police Officer name', entity: 'PON', isSelected: true },
                        { "id": 27, "title": 'Badge No', entity: 'BN', isSelected: true },
                        { "id": 28, "title": 'Vehicle information for your car or car you were a passenger in', entity: 'VI', isSelected: true },
                        { "id": 29, "title": 'Vehicle information for defendant(s)', entity: 'VID', isSelected: true },
                        { "id": 30, "title": 'Describe your incident in detail', entity: 'ID', isSelected: true },
                        { "id": 31, "title": 'Hospital Information', entity: 'HI', isSelected: true },
                        { "id": 32, "title": 'Treatment type', entity: 'TT', isSelected: true },
                        { "id": 33, "title": 'Describe Property damage', entity: 'PD', isSelected: true },
                        { "id": 34, "title": 'Describe Vehicle damage', entity: 'VD', isSelected: true },
                        { "id": 35, "title": 'Describe why and by whom the vehicle was towed', entity: 'VT', isSelected: true },
                        { "id": 36, "title": 'Intersections?', entity: 'IT', isSelected: true },
                        { "id": 37, "title": 'Name of park/roadway including intersection', entity: 'NI', isSelected: true },
                        { "id": 38, "title": 'Building management information', entity: 'BM', isSelected: true },
                        { "id": 39, "title": 'Superintendent information', entity: 'SI', isSelected: true },
                        { "id": 40, "title": 'Stairway information', entity: 'STI', isSelected: true },
                        { "id": 41, "title": 'Did you report the incident to anyone? Give details', entity: 'RD', isSelected: true },

                    ]
                },
                {
                    "id": 42, "title": 'Insurance Details', entity: 'INTID', isSelected: true,
                    "items": [{
                        "id": 43, "title": 'Health Insurance', entity: 'HID', isSelected: true,
                        "items": [
                            {
                                "id": 44, "title": 'Policy Number', entity: 'PN', isSelected: true
                            },
                            {
                                "id": 45, "title": 'Claim Number', entity: 'CN', isSelected: true
                            },
                            {
                                "id": 46, "title": 'Describe company and reason for denial', entity: 'CRD', isSelected: true
                            },
                            {
                                "id": 47, "title": 'Have you ever been on State Insurance of any type?Describe', entity: 'SIT', isSelected: true
                            }
                        ]
                    },
                    {
                        "id": 48, "title": 'Automobile Insurance', entity: 'INTAI', isSelected: true,
                        "items": [
                            { "id": 49, "title": 'Policy Number', entity: 'APN', isSelected: true },
                            { "id": 50, "title": 'Claim Number', entity: 'ACN', isSelected: true },
                            { "id": 51, "title": 'Driver Licence Number', entity: 'DLN', isSelected: true },
                            { "id": 52, "title": 'Duration for which state licence was held', entity: 'LTH', isSelected: true },
                            { "id": 53, "title": 'Please state how much coverage', entity: 'SC', isSelected: true },
                            { "id": 54, "title": 'Year of Vehicle', entity: 'YV', isSelected: true },
                            { "id": 55, "title": 'Model of Vehicle', entity: 'MV', isSelected: true },
                            { "id": 56, "title": 'Color of Vehicle', entity: 'CV', isSelected: true },
                            { "id": 57, "title": 'Claim No', entity: 'CLN', isSelected: true },
                            { "id": 58, "title": 'Vehicle Insurance information for client', entity: 'VII', isSelected: true },
                            { "id": 59, "title": 'Make and Model', entity: 'MM', isSelected: true },
                            { "id": 60, "title": 'Owner of Vehicle', entity: 'OV', isSelected: true },
                            { "id": 61, "title": 'Insurance coverage information', entity: 'ICI', isSelected: true },

                        ]
                    },
                    {
                        "id": 62, "title": 'Other Driver insurance coverage information', entity: 'INTODI', isSelected: true,
                        "items": [
                            { "id": 63, "title": 'Year of Vehicle', entity: 'OYV', isSelected: true },
                            { "id": 64, "title": 'Model of Vehicle', entity: 'OMV', isSelected: true },
                            { "id": 65, "title": 'Color of Vehicle', entity: 'OCV', isSelected: true },
                            { "id": 66, "title": 'Policy Number', entity: 'OPC', isSelected: true },
                            { "id": 67, "title": 'Claim Number', entity: 'OCN', isSelected: true },
                        ]
                    }
                    ],
                },
                {
                    "id": 68, "title": 'Med Mal Details', entity: 'INTMMS', isSelected: true,

                    "items": [
                        { "id": 69, "title": 'Type of Malpractice', entity: 'TM', isSelected: true },
                        { "id": 70, "title": 'Describe what happened', entity: 'DH', isSelected: true },
                        { "id": 71, "title": 'Injuries sustained?', entity: 'IS', isSelected: true },
                        { "id": 72, "title": 'List radiology and medical offices that may be responsible', entity: 'LR', isSelected: true },
                        { "id": 73, "title": 'As a result of your injuries what activities are you no longer able to do?', entity: 'IA', isSelected: true },
                        { "id": 74, "title": 'List all medications currently being taken', entity: 'MCT', isSelected: true },
                        { "id": 75, "title": 'List any out of pocket expenses as a result of this malpractice', entity: 'PE', isSelected: true },
                        { "id": 76, "title": 'List all medical bills received as a result of this incident', entity: 'MB', isSelected: true },
                    ]
                },
                {
                    "id": 77, "title": 'Other Details', entity: 'INTOD', isSelected: true,

                    "items": [
                        { "id": 78, "title": 'Have you ever filled a claim and/or lawsuit for personal injuries?-Describe', entity: 'CLD', isSelected: true },
                        { "id": 79, "title": 'Nature of Disability', entity: 'ND', isSelected: true },
                        { "id": 80, "title": 'Describe what body parts were disable', entity: 'BP', isSelected: true },
                        { "id": 81, "title": 'Describe how and when injured ', entity: 'HWI', isSelected: true },
                        { "id": 88, "title": 'List health care providers for workers compensation injuries', entity: 'LHC', isSelected: true },
                        { "id": 89, "title": 'Have you ever been involved in a lawsuit?-Describe', entity: 'ILD', isSelected: true },
                        { "id": 90, "title": 'Do you have any judgments pending against you now?-Describe', entity: 'DJP', isSelected: true },
                        { "id": 91, "title": 'Have you received state aid of any type?-Describe', entity: 'SA', isSelected: true },
                        { "id": 92, "title": 'Do you have a court ordered child support obligation?-Describe', entity: 'CS', isSelected: true },
                        { "id": 93, "title": 'Service Branch', entity: 'SB', isSelected: true },
                        { "id": 94, "title": 'Service Number', entity: 'SN', isSelected: true },
                        { "id": 95, "title": 'Type of Discharge', entity: 'TD', isSelected: true },
                        { "id": 96, "title": 'Awards Received', entity: 'AR', isSelected: true },
                        { "id": 97, "title": 'Information on any service connected injuries or disability', entity: 'ISC', isSelected: true },
                        { "id": 98, "title": 'Describe details of payments received for service connected injuries', entity: 'PRI', isSelected: true },
                        { "id": 100, "title": 'Do you now or have you ever had eye glasses and/or hearing aid?-Describe', entity: 'EGH', isSelected: true },
                        { "id": 101, "title": 'Have you ever been treated for alcohol and/or drug', entity: 'TAD', isSelected: true },
                    ]
                },
                {
                    "id": 102, "title": 'Memo', entity: 'IM', isSelected: true
                },
                ]
            }, {
                "id": 3, "title": 'Intake Notes', entity: 'INT', isSelected: true,

            },
        ])



})();
