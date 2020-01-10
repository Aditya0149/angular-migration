(function (angular) {

    'use strict';

    angular.module('clxFilterOptions', [])
    .directive('clxFilterOptions', clxFilterOptions);

    function clxFilterOptions() {
        var directive = {
            restrict: 'E',
            link: linkFn,
            scope: {
                fiterOpts: '=',
                selectedFilter: '=',
                onFilterSelect: '&'
            },
            controllerAs: 'clxFilters',
            bindToController: true,
            controller: clxFilterOptionsCtrl,
            templateUrl: 'app/utils/clxFilterOptions/clxFilterOptions.html'
        }

        return directive;

        function linkFn() {

        }
    }

    clxFilterOptionsCtrl.$inject = ['$scope', '$attrs'];

    function clxFilterOptionsCtrl($scope, $attrs) {
        var vm = this;
        vm.showCount = angular.isDefined($attrs.showCount);
        vm.centered = angular.isDefined($attrs.centered);
        $scope.$watch(function () {
            return vm.selectedFilter;
        }, function (newFilter, oldVal) {
            if (angular.isDefined(oldVal) && (newFilter !== oldVal)) {
                if (angular.isDefined(vm.onFilterSelect())) {
                    vm.onFilterSelect()(newFilter);
                }
            }
        });

        vm.isActive = function (selectedFilter, key) {
            return _.isEqual(selectedFilter, key);
        };

    }

})(angular);