(function (angular) {
    angular
        .module('cloudlex.launcher', [])
        .config(['$stateProvider', function ($stateProvider) {

            $stateProvider
                .state('launcher', {
                    url: '/launcher',
                    templateUrl: 'app/launcher/launcher.html',
                    controller: 'launcherCtrl as launcher',
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = true;
                        $rootScope.onMatter = false;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    },
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    }
                })
        }])

})(angular);
