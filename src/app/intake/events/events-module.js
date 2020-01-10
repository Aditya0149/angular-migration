
(function () {
    'use strict';

    angular.module('intake.events', ['ui.router'])

        .config(['$stateProvider', function ($stateProvider) {
            $stateProvider
                .state('intakeevents', {
                    url: '/intake/events/:intakeId',
                    templateUrl: 'app/intake/events/events.html',
                    controller: 'IntakeEventsCtrl as events',
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = false;
                        $rootScope.onIntake = true;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    }
                })
        }]);

})();
