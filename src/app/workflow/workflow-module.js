
(function () {
    'use strict';

    angular.module('cloudlex.workflow', ['ui.router'])
       
    .config(['$stateProvider',  function ($stateProvider) {
        $stateProvider
        .state('workflow', {
            url: '/workflow/:matterId',
            templateUrl: 'app/workflow/workflow.html',
            controller: 'matterWorkflowCtrl as workflow',
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