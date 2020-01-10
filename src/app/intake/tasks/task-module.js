(function (angular) {

    'use strict';

    angular.module('intake.tasks', ['ui.router']);

    angular.module('intake.tasks')
        .config(['$stateProvider', function ($stateProvider) {

            $stateProvider
                .state('intaketasks', {
                    url: '/intake/tasks/:intakeId',
                    templateUrl: 'app/intake/tasks/matter-tasks/tasks.html',
                    controller: 'IntakeTasksController as task',
                    resolve: {
                        'MasterData': ['intakeMasterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
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
                }).state('intaketasks-add', {
                    url: '/add-task/:intakeId',
                    templateUrl: 'app/intake/tasks/add-task/add-task.html',
                    controller: 'IntakeAddTaskCtrl as addTask',
                    resolve: {
                        'MasterData': ['intakeMasterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    }

                }).state('intaketasks-edit', {
                    url: '/add-task/:intakeId/:taskId',
                    templateUrl: 'app/intake/tasks/add-task/add-task.html',
                    controller: 'IntakeAddTaskCtrl as addTask',
                    resolve: {
                        'MasterData': ['intakeMasterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    }

                })

        }]);


})(angular);
