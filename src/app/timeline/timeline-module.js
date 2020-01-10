
(function () {
    'use strict';

    angular.module('cloudlex.timeline', ['ui.router'])

        .config(['$stateProvider', function ($stateProvider) {
            $stateProvider
                .state('timeline', {
                    url: '/timeline/:matterId',
                    templateUrl: 'app/timeline/timeline.html',
                    controller: 'TimelineCtrl as timeline'
                })
        }]);

})();


//$routeProvider.when('/events/:matterId', {
//    templateUrl: 'app/events/events.html',
//    controller: 'EventsCtrl as events'
//});