(function (angular) {
    angular
        .module('intake.dashboard', [])
        .config(['$stateProvider', function ($stateProvider) {

            $stateProvider
                .state('intakedashboard', {
                    url: '/intake/dashboard',
                    abstract: true,
                    templateUrl: 'app/intake/dashboard/dashboard.html',
                    controller: 'IntakeDashboardCtrl as dashboard',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }],
                        'RoleData': ['masterData', function (masterData) {
                            var role = masterData.getUserRole();
                            if (utils.isEmptyObj(role)) {
                                return masterData.fetchUserRole();
                            }
                            return role;
                        }]
                    }
                })
                .state('intakedashboard.analytics', {
                    url: '',
                    templateUrl: 'app/intake/dashboard/analytics/analytics.html',
                    controller: 'IntakeAnalyticsCtrl as dashboardAnalytics',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            return masterData.fetchMasterData();
                        }],
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
                .state('intakedashboard.critical-dates', {
                    url: '/critical-dates',
                    templateUrl: 'app/intake/dashboard/critical-dates/critical-dates.html',
                    controller: 'IntakeCriticalDatesCtrl as dashboardCriticalDates',
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
                .state('intakedashboard.tasks', {
                    url: '/tasks',
                    templateUrl: 'app/intake/dashboard/tasks/dashboard-tasks.html',
                    controller: 'IntakeDashboardTasksCtrl as dashboardTasks',
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
        }])

})(angular);