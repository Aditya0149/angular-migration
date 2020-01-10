'use strict';

angular.module('cloudlex.upcoming', [])

    .config(['$stateProvider', function ($stateProvider) {

        $stateProvider

            .state('referral-engine-details-up', {
                url: '/upcoming-details/referral-engine-upcoming',
                templateUrl: 'app/marketplace/upcoming-details/referral-engine-upcoming.html',
                controller: 'upcompingAppsCtrl as upcompingAppsCtrl',
            }).state('referral-exchange-details-up', {
                url: '/upcoming-details/referral-exchange-upcoming',
                templateUrl: 'app/marketplace/upcoming-details/referral-exchange-upcoming.html',
                controller: 'upcompingAppsCtrl as upcompingAppsCtrl',
            }).state('word-officePlug-details-up', {
                url: '/upcoming-details/ffice-word-plugin-upcoming',
                templateUrl: 'app/marketplace/upcoming-details/office-word-plugin-upcoming.html',
                controller: 'upcompingAppsCtrl as upcompingAppsCtrl',
            })
            .state('c-com-details-up', {
                url: '/upcoming-details/client-communicator-upcoming',
                templateUrl: 'app/marketplace/upcoming-details/client-communicator-upcoming.html',
                controller: 'upcompingAppsCtrl as upcompingAppsCtrl',
            })
            .state('digatl-archival-details-up', {
                url: '/upcoming-details/digital-archival-upcoming',
                templateUrl: 'app/marketplace/upcoming-details/digital-archival-upcoming.html',
                controller: 'upcompingAppsCtrl as upcompingAppsCtrl',
            })
            .state('digital-lexvia-service-up', {
                url: '/lexvia-service-details-up/lexvia-service-upcoming',
                templateUrl: 'app/marketplace/upcoming-details/lexvia-service-upcoming.html',
                controller: 'servicesCtrl as servicesCtrl',
            })
            .state('office-online-details-up', {
                url: '/upcoming-details/office-online-upcoming',
                templateUrl: 'app/marketplace/upcoming-details/office-online-upcoming.html',
                controller: 'upcompingAppsCtrl as upcompingAppsCtrl',
            })


    }]);
