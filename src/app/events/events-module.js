
(function () {
    'use strict';

    angular.module('cloudlex.events', ['ui.router'])

        .config(['$stateProvider', '$routeProvider', function ($stateProvider, $routeProvider) {
            $stateProvider
                .state('events', {
                    url: '/events/:matterId',
                    templateUrl: 'app/events/events.html',
                    controller: 'EventsCtrl as events',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    },
                    onEnter: function () {
                        // $rootScope.onLauncher = false;
                        // $rootScope.onMatter = true;
                        // $rootScope.onIntake = false;
                        // $rootScope.onReferral = false;
                        // $rootScope.onArchival = false;
                        // $rootScope.onMarkerplace = false;
                    }
                })

                .state('matter-collaboration-events', {
                    url: '/matter-sharing-events/:matterId/:eventId',
                    templateUrl: 'app/events/partials/matter-collaboration-event.html',
                    controller: 'matterCollaborationEventCtrl as matterCEvents',
                    resolve: {
                        // 'MasterData': ['masterData', function (masterData) {
                        //     var data = masterData.getMasterData();
                        //     if (utils.isEmptyObj(data)) {
                        //         return masterData.fetchMasterData();
                        //     }
                        //     return data;
                        // }]
                    },
                    onEnter: function () {
                        // $rootScope.onLauncher = false;
                        // $rootScope.onMatter = true;
                        // $rootScope.onIntake = false;
                        // $rootScope.onReferral = false;
                        // $rootScope.onArchival = false;
                        // $rootScope.onMarkerplace = false;
                    }
                })

        }]);

})();


//$routeProvider.when('/events/:matterId', {
//    templateUrl: 'app/events/events.html',
//    controller: 'EventsCtrl as events'
//});
