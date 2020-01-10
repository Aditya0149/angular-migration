
(function () {
    'use strict';

    angular.module('cloudlex.dailymailscan', ['ui.router'])

        .config(['$stateProvider', function ($stateProvider) {
            $stateProvider
                .state('dailymailscan', {
                    url: '/dailymailscan',
                    templateUrl: 'app/dailymailscan/dailymail-list.html',
                    controller: 'DailymailscanCtrl as dailymailscan'
                })
        }]);

})();

