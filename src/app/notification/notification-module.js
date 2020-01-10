(function (angular) {
    'use strict';

    angular.module('cloudlex.notification', ['ui.router'])

        .config(['$stateProvider', function ($stateProvider) {
            $stateProvider
                .state('notification', {
                    url: '/notification',
                    templateUrl: 'app/notification/notification.html',
                    controller: "NotificationCtrl as notif",
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    },
                    breadcrum: [{ name: 'Notification' }]
                });
        }]);

})(angular);