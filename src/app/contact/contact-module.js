(function () {
    'use strict';

    angular.module('cloudlex.contact', ['ui.router', 'cloudlex.documents'])

        .config(['$stateProvider', function ($stateProvider) {
            $stateProvider
                .state('globalContact', {
                    url: '/contacts',
                    templateUrl: 'app/contact/contact-list.html',
                    controller: 'ContactListCtrl as contactList',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    },
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onContactManager = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    }
                })
                .state('intakeglobalContact', {
                    url: '/intake/contacts',
                    templateUrl: 'app/contact/contact-list.html',
                    controller: 'ContactListCtrl as contactList',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData().then(function (res) {
                                    return res;
                                });
                            }
                            return data;
                        }]
                    },
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onContactManager = false;
                        $rootScope.onMatter = false;
                        $rootScope.onIntake = true;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    }
                })
                .state('launcherglobalContact', {
                    url: '/launcher/contacts',
                    templateUrl: 'app/contact/contact-list.html',
                    controller: 'ContactListCtrl as contactList',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData().then(function (res) {
                                    return res;
                                });
                            }
                            return data;
                        }]
                    },
                    onEnter: function ($rootScope) {
                        $rootScope.onContactManager = true;
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = false;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    }
                });
        }]);

})();