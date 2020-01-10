
(function (angular) {
    'use strict';

    /**
 * @ngdoc module
 * @name cloudlex.referralprg
 * @requires ui.router
 * @description
 * # cloudlex.referral sub-module
 *
 * This module is a for referral. It contains all the controllers, services, filter specific to referral.
 */
    angular.module('cloudlex.referralprg', ['ngRoute', 'ui.router'])
        .config(['$stateProvider', function ($stateProvider) {

            $stateProvider
                .state('referral-program', {
                    url: '/referral-program',
                    templateUrl: 'app/referral-program/referral-prg.html',
                    controller: 'RefferalProgramCtrl as referralPrg',
                    resolve: {
                        'RoleData': ['masterData', function (masterData) {
                            var role = masterData.getUserRole();
                            if (utils.isEmptyObj(role)) {
                                return masterData.fetchUserRole();
                            }
                            return role;
                        }]
                    },
                    onEnter: function ($rootScope) {
                        var launchpad = JSON.parse(localStorage.getItem('launchpadSetting'));
                        if (launchpad && launchpad.enabled != 1) {
                            $rootScope.onLauncher = false;
                            $rootScope.onMatter = true;
                            $rootScope.onIntake = false;
                            $rootScope.onReferral = false;
                            $rootScope.onArchival = false;
                            $rootScope.onMarkerplace = false;
                            $rootScope.onExpense = false;
                            $rootScope.onReferralPrg = false;
                        } else {
                            $rootScope.onLauncher = false;
                            $rootScope.onMatter = false;
                            $rootScope.onIntake = false;
                            $rootScope.onReferral = false;
                            $rootScope.onArchival = false;
                            $rootScope.onMarkerplace = false;
                            $rootScope.onExpense = false;
                            $rootScope.onReferralPrg = true;
                        }

                    }
                })
        }]);

})(angular);