;

(function () {
    'use strict';

    angular.module('intake.allParties', ['ui.router'])
        .config(['$stateProvider', function ($stateProvider) {

            $stateProvider
                .state('plaintiff', {
                    url: '/intake/plaintiff/:intakeId',
                    templateUrl: 'app/intake/all-parties/all-parties.html',
                    controller: 'IntakePlaintiffCtrl as matterCtrl',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    }
                });
        }]);

})();