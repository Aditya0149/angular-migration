'use strict';

angular.module('cloudlex.allnotifications', [])

    .config(['$stateProvider', function ($stateProvider) {

        $stateProvider
            .state('allnotifications', {
                url: '/notifications',
                templateUrl: 'app/allnotifications/allnotifications.html',
                controller: 'AllNotificationsCtrl as notiCtrl',
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
                    $rootScope.onNotifications = true;
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
