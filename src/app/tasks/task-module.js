(function (angular) {

    'use strict';

    angular.module('cloudlex.tasks', ['ui.router']);

    angular.module('cloudlex.tasks')
        .config(['$stateProvider', function ($stateProvider) {

            $stateProvider
                .state('tasks', {
                    url: '/tasks/:matterId',
                    templateUrl: 'app/tasks/matter-tasks/tasks.html',
                    controller: 'TasksController as task',
                    onEnter: function ($rootScope) {
                        // $rootScope.onLauncher = false;
                        // $rootScope.onMatter = true;
                        // $rootScope.onIntake = false;
                        // $rootScope.onReferral = false;
                        // $rootScope.onArchival = false;
                        // $rootScope.onMarkerplace = false;
                    }
                }).state('tasks-add', {
                    url: '/add-task/:matterId',
                    templateUrl: 'app/tasks/add-task/add-task.html',
                    controller: 'AddTaskCtrl as addTask',

                }).state('tasks-edit', {
                    url: '/add-task/:matterId/:taskId',
                    templateUrl: 'app/tasks/add-task/add-task.html',
                    controller: 'AddTaskCtrl as addTask',

                })
            //.state('tasks-global', {
            //    url: '/tasks',
            //    templateUrl: 'app/tasks/global-tasks/global-tasks.html',
            //    controller: 'GlobalTaskCtrl as globalTasks'
            //});

        }]);


})(angular);
