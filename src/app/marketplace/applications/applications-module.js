'use strict';

angular.module('cloudlex.applications', [])

    .config(['$stateProvider', function ($stateProvider) {

        $stateProvider

            .state('referral-details', {
                url: '/application-details/referral',
                templateUrl: 'app/marketplace/application-details/referral.html',
                controller: 'applicationCtrl as applicationCtrl',
                onEnter: function () {
                    localStorage.setItem("state", 'Referral Engine');
                    localStorage.setItem("selectedType", "RE");
                }
            })
            .state('c-com-details', {
                url: '/application-details/client-communicator',
                templateUrl: 'app/marketplace/application-details/client-communicator.html',
                controller: 'applicationCtrl as applicationCtrl',
            })
            .state('digatl-archival-details', {
                url: '/application-details/digital-archival',
                templateUrl: 'app/marketplace/application-details/digital-archival.html',
                controller: 'applicationCtrl as applicationCtrl',
                onEnter: function () {
                    localStorage.setItem("state", 'Digital Archiver');
                    localStorage.setItem("selectedType", "DA");
                }
            })
            .state('office-online-details', {
                url: '/application-details/office-online',
                templateUrl: 'app/marketplace/application-details/office-online.html',
                controller: 'applicationCtrl as applicationCtrl',
            }).state('Integration-tools-details', {
                url: '/application-details/Integration-tools',
                templateUrl: 'app/marketplace/application-details/Integration-tools.html',
                controller: 'applicationCtrl as applicationCtrl',
            }).state('word-plugin-details', {
                url: '/application-details/office-word-plugin',
                templateUrl: 'app/marketplace/application-details/office-word-plugin.html',
                controller: 'applicationCtrl as applicationCtrl',
            }).state('outlook-plugin-details', {
                url: '/application-details/email-connector',
                templateUrl: 'app/marketplace/application-details/outlook-plugin.html',
                controller: 'applicationCtrl as applicationCtrl',
            }).state('intake-manager-details', {
                url: '/application-details/intake-manager',
                templateUrl: 'app/marketplace/application-details/intake-manager.html',
                controller: 'applicationCtrl as applicationCtrl',
                onEnter: function () {
                    localStorage.setItem("state", 'Intake Manager');
                    localStorage.setItem("selectedType", "IM");
                }
            }).state('gmail-plugin-details', {
                url: '/application-details/email-connector',
                templateUrl: 'app/marketplace/application-details/gmail-plugin.html',
                controller: 'applicationCtrl as applicationCtrl',
            }).state('sms-details', {
                url: '/application-details/sms',
                templateUrl: 'app/marketplace/application-details/sms-details.html',
                controller: 'applicationCtrl as applicationCtrl',
                onEnter: function () {
                    localStorage.setItem("state", 'Client Messenger');
                    localStorage.setItem("selectedType", "SMS");
                }
            }).state('lead-generator', {
                url: '/application-details/lead-generator',
                templateUrl: 'app/marketplace/application-details/sms_detail_1.html',
                controller: 'applicationCtrl as applicationCtrl',
                onEnter: function () {
                    localStorage.setItem("state", 'Lead Generator');
                    localStorage.setItem("selectedType", "LG");
                }
            }).state('expense-manager', {
                url: '/application-details/expense-manager',
                templateUrl: 'app/marketplace/application-details/sms_detail_2.html',
                controller: 'applicationCtrl as applicationCtrl',
                onEnter: function () {
                    localStorage.setItem("state", 'Expense Manager');
                    localStorage.setItem("selectedType", "EM");
                }
            })


    }]);