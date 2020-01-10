
(function (angular) {
    'use strict';

    /**
 * @ngdoc module
 * @name intake.referral
 * @requires ui.router
 * @description
 * # intake.referral sub-module
 *
 * This module is a for referral. It contains all the controllers, services, filter specific to referral.
 */
    angular.module('intake.referral', ['ui.router']);

    angular
        .module('intake.referral')
        .config(['$stateProvider', function ($stateProvider) {

            $stateProvider
                .state('refer-out-intake', {
                    url: '/intake/refer-out-intake/:intakeId',
                    templateUrl: 'app/intake/referral/refer-out-matter/refer-out-matter.html',
                    controller: 'ReferrOutIntakeCtrl as intakeReferOut',
                    params: {
                        intakeId: null,
                        fromMatterList: false
                    },
                }).state('referred-intake', {
                    url: '/intake/referred-intake',
                    templateUrl: 'app/intake/referral/referred-matters/referred-matters.html',
                    controller: 'RefferedIntakeCtrl as intakeReferred',
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
                            $rootScope.onReferral = true;
                            $rootScope.onArchival = false;
                            $rootScope.onMarkerplace = false;
                            $rootScope.onExpense = false;
                            $rootScope.onReferralPrg = false;
                        }

                    }
                }).state('referred-in-intake', {
                    url: '/intake/referred-intake/:tab',
                    templateUrl: 'app/intake/referral/referred-matters/referred-matters.html',
                    controller: 'RefferedIntakeCtrl as intakeReferred',
                    resolve: {
                        'RoleData': ['masterData', function (masterData) {
                            var role = masterData.getUserRole();
                            if (utils.isEmptyObj(role)) {
                                return masterData.fetchUserRole();
                            }
                            return role;
                        }]
                    }
                })
        }]);

})(angular);