
(function () {
    'use strict';

    angular.module('cloudlex.firms', ['ui.router'])
        .config(['$stateProvider', function ($stateProvider) {
            $stateProvider
                .state('firms', {
                    url: '/firms',
                    params: {
                        credentials: null
                    },
                    templateUrl: 'app/firms/firms.html',
                    controller: 'FirmsCtrl as firms',

                })
        }]);

})();