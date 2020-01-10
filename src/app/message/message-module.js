(function (angular) {
    'use strict';

    angular.module('cloudlex.message', ['ui.router'])

        .config(['$stateProvider', function ($stateProvider) {
            $stateProvider
                .state('message', {
                    url: '/message',
                    templateUrl: 'app//message/message.html',
                    controller: "MessageController as message",
                })
                .state('messageNotify', {
                    url: '/messageNotify',
                    templateUrl: 'app/message/partials/messageNotify.html',
                    controller: "MessageNotifyCtrl as messageNotify",
                });
        }]);

})(angular);