
(function () {
    'use strict';

    angular.module('cloudlex.motion', ['ui.router']);

    //.config(['$stateProvider',  function ($stateProvider) {
    //    $stateProvider
    //        .state('motion', {
    //            url: '/motion/:matterId',
    //            templateUrl: 'app/motion/motion.html',
    //            controller: 'MotionCtrl as motionCtrl',
    //            resolve: {
    //                'MasterData': ['masterData', function (masterData) {
    //                    var data = masterData.getMasterData();
    //                    if (utils.isEmptyObj(data)) {
    //                        return masterData.fetchMasterData();
    //                    }
    //                    return data;
    //                }]
    //            }
    //        })
    //}]);

})();