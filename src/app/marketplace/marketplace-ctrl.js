(function (angular) {

    angular.module('cloudlex.marketplace')
        .controller('marketplaceCtrl', marketplaceCtrl)

    marketplaceCtrl.$inject = ['$state', 'masterData'];
    function marketplaceCtrl($state, masterData) {

        var vm = this;

        vm.changePage = changePage;
        vm.highlightCurrentNav = highlightCurrentNav;

        (function () {

            vm.role = masterData.getUserRole();
            vm.settingsNavigation = [
                { name: 'Applications', state: '.applications' },
                { name: 'Services', state: '.services' },
                // { name: 'Upcoming', state: '.upcoming' },
            ];
        })();

        function changePage(stateName) {
            $state.go(stateName);
        }

        function highlightCurrentNav(stateName) {
            var state = ('marketplace' + stateName);
            return $state.current.name === state;
        }

    }

})(angular);
