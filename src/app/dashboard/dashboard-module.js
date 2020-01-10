(function (angular) {
    angular
        .module('cloudlex.dashboard', [])
        .config(['$stateProvider', function ($stateProvider) {
            $stateProvider
                .state('dashboard', {
                    url: '/dashboard',
                    abstract: true,
                    templateUrl: 'app/dashboard/dashboard.html',
                    controller: 'DashboardCtrl as dashboard',
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
                .state('dashboard.analytics', {
                    url: '',
                    templateUrl: 'app/dashboard/analytics/analytics.html',
                    controller: 'AnalyticsCtrl as dashboardAnalytics',
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
                    }
                })
                .state('dashboard.critical-dates', {
                    url: '/critical-dates',
                    templateUrl: 'app/dashboard/critical-dates/critical-dates.html',
                    controller: 'CriticalDatesCtrl as dashboardCriticalDates',
                })
                .state('dashboard.tasks', {
                    url: '/tasks',
                    templateUrl: 'app/dashboard/tasks/dashboard-tasks.html',
                    controller: 'DashboardTasksCtrl as dashboardTasks',
                })
        }])

})(angular);