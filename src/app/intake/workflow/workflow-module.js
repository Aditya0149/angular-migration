
(function () {
    'use strict';

    angular.module('intake.workflow', ['ui.router'])

        .config(['$stateProvider', function ($stateProvider) {
            $stateProvider
                .state('intakeworkflow', {
                    url: '/intake/workflow/:intakeId',
                    templateUrl: 'app/intake/workflow/workflow.html',
                    controller: 'WorkflowintakeCtrl as workflow',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    }
                })
        }]);

})();


//$routeProvider.when('/events/:matterId', {
//    templateUrl: 'app/events/events.html',
//    controller: 'EventsCtrl as events'
//});