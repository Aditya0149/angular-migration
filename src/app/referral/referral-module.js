
(function (angular) {
    'use strict';

    /**
 * @ngdoc module
 * @name cloudlex.referral
 * @requires ui.router
 * @description
 * # cloudlex.referral sub-module
 *
 * This module is a for referral. It contains all the controllers, services, filter specific to referral.
 */
    angular.module('cloudlex.referral', ['ui.router']);

    angular
        .module('cloudlex.referral')
        .config(['$stateProvider', function ($stateProvider) {

            $stateProvider
                .state('refer-out-matter', {
                    url: '/refer-out/:matterId',
                    templateUrl: 'app/referral/refer-out-matter/refer-out-matter.html',
                    controller: 'ReferrOutCtrl as referOut',
                    params: {
                        matterId: null,
                        fromMatterList: false
                    },
                }).state('referred-matters', {
                    url: '/referred-matters',
                    templateUrl: 'app/referral/referred-matters/referred-matters.html',
                    controller: 'RefferedMattersCtrl as referred',
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
                }).state('referred-in-matters', {
                    url: '/referred-matters/:tab',
                    templateUrl: 'app/referral/referred-matters/referred-matters.html',
                    controller: 'RefferedMattersCtrl as referred',
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