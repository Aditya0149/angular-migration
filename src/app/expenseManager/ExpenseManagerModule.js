(function (angular) {
    angular
        .module('cloudlex.expense', [])
        .config(['$stateProvider', function ($stateProvider) {

            $stateProvider
                .state('expenseManager', {
                    url: '/expenseManager',
                    templateUrl: 'app/expenseManager/ExpenseManager.html',
                    controller: 'expenseManagerGridCtrl as expenseManager',
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = false;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = true;
                        $rootScope.onReferralPrg = false;
                    }
                })
        }])

})(angular);
