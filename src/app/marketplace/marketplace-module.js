'use strict';

angular.module('cloudlex.marketplace', [])

    .config(['$stateProvider', function ($stateProvider) {

        $stateProvider
            .state('marketplace', {
                url: '/marketplace',
                abstract: true,
                templateUrl: 'app/marketplace/marketplace.html',
                controller: 'marketplaceCtrl as marketplace',

            })
            .state('marketplace.applications', {
                url: '',
                templateUrl: 'app/marketplace/applications/applications.html',
                controller: 'applicationCtrl as applicationCtrl',
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
                        $rootScope.onMarkerplace = true;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    }

                }

            })
            .state('marketplace.services', {
                url: '/services',
                templateUrl: 'app/marketplace/services/services.html',
                controller: 'servicesCtrl as servicesCtrl',

            })
            .state('marketplace.upcoming', {
                url: '/upcoming',
                templateUrl: 'app/marketplace/upcoming/upcoming.html',
                controller: 'upcompingAppsCtrl as upcompingAppsCtrl',

            })

    }]);